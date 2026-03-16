import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme/colors';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/auth-context';
import { extractYouTubeTranscript } from '@/lib/youtube';

// ------- Types -------

type ScreenPhase = 'input' | 'loading' | 'error' | 'review';
type InputMode = 'youtube' | 'text';

interface ExtractedIngredient {
  name: string;
  quantity: string;
  unit: string;
  selected: boolean;
}

// ------- Helpers -------

/** Format an ingredient into a readable name string for the grocery list. */
function formatIngredientName(ing: ExtractedIngredient): string {
  const parts: string[] = [];
  if (ing.quantity && ing.quantity !== '0') parts.push(ing.quantity);
  if (ing.unit) parts.push(ing.unit);
  parts.push(ing.name);
  return parts.join(' ').trim();
}

// ------- Main Screen -------

export default function ImportRecipeScreen() {
  const router = useRouter();
  const { user, household } = useSession();

  // Phase + input state
  const [phase, setPhase] = useState<ScreenPhase>('input');
  const [mode, setMode] = useState<InputMode>('youtube');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  // Error state
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFromYoutube, setErrorFromYoutube] = useState(false);

  // Review state
  const [recipeTitle, setRecipeTitle] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<ExtractedIngredient[]>([]);
  const [inserting, setInserting] = useState(false);

  // ---- Input helpers ----

  const inputValue = mode === 'youtube' ? url : text;
  const isInputEmpty = inputValue.trim().length === 0;

  // ---- Extract ----

  const handleExtract = useCallback(async () => {
    setPhase('loading');
    setErrorMessage('');
    setErrorFromYoutube(false);

    try {
      let bodyToSend: { mode: string; text?: string; url?: string };
      let youtubeTitle: string | null = null;

      if (mode === 'youtube') {
        // Client-side YouTube transcript extraction (avoids cloud IP rate limits)
        const result = await extractYouTubeTranscript(url.trim());
        if (!result.ok) {
          setErrorMessage(result.error.error);
          setErrorFromYoutube(true);
          setPhase('error');
          return;
        }
        // Send transcript via text mode to the Edge Function
        bodyToSend = { mode: 'text', text: result.data.transcript };
        youtubeTitle = result.data.title;
      } else {
        bodyToSend = { mode: 'text', text: text.trim() };
      }

      const { data, error } = await supabase.functions.invoke('import-recipe', {
        body: bodyToSend,
      });

      // Network-level error from supabase.functions.invoke
      if (error) {
        const message = data?.error ?? error.message ?? 'Recipe extraction failed';
        setErrorMessage(message);
        setErrorFromYoutube(mode === 'youtube');
        setPhase('error');
        return;
      }

      // Application-level error from the Edge Function
      if (data?.error) {
        setErrorMessage(data.error);
        setErrorFromYoutube(mode === 'youtube');
        setPhase('error');
        return;
      }

      // Empty ingredients → "no recipe found"
      if (!data?.ingredients || !Array.isArray(data.ingredients) || data.ingredients.length === 0) {
        setErrorMessage(
          'No recipe ingredients were found. Try pasting the ingredient list manually for better results.'
        );
        setErrorFromYoutube(mode === 'youtube');
        setPhase('error');
        return;
      }

      // Success — hydrate ingredients with selection state
      const parsed: ExtractedIngredient[] = data.ingredients.map(
        (ing: { name: string; quantity: string; unit: string }) => ({
          name: ing.name,
          quantity: ing.quantity ?? '',
          unit: ing.unit ?? '',
          selected: true,
        })
      );

      // Use Gemini title, fall back to YouTube page title
      setRecipeTitle(data.title ?? youtubeTitle ?? null);
      setIngredients(parsed);
      setPhase('review');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setErrorMessage(msg);
      setErrorFromYoutube(mode === 'youtube');
      setPhase('error');
    }
  }, [mode, url, text]);

  // ---- Selection ----

  const toggleIngredient = useCallback((index: number) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, selected: !ing.selected } : ing))
    );
  }, []);

  const selectedCount = ingredients.filter((i) => i.selected).length;
  const allSelected = selectedCount === ingredients.length;

  const toggleSelectAll = useCallback(() => {
    const nextState = !allSelected;
    setIngredients((prev) => prev.map((ing) => ({ ...ing, selected: nextState })));
  }, [allSelected]);

  // ---- Bulk insert ----

  const handleAddSelected = useCallback(async () => {
    if (!household?.id || !user?.id) {
      Alert.alert('Error', 'You must be in a household to add items.');
      return;
    }

    const selected = ingredients.filter((i) => i.selected);
    if (selected.length === 0) return;

    setInserting(true);

    const results = await Promise.allSettled(
      selected.map((ing) =>
        supabase
          .from('grocery_items')
          .insert({
            household_id: household.id,
            name: formatIngredientName(ing),
            quantity: 1,
            created_by: user.id,
            source: 'recipe',
          })
          .select()
      )
    );

    const failures = results.filter((r) => r.status === 'rejected');
    const dbErrors = results.filter(
      (r) => r.status === 'fulfilled' && r.value.error
    );
    const totalFailed = failures.length + dbErrors.length;

    setInserting(false);

    if (totalFailed > 0 && totalFailed < selected.length) {
      Alert.alert(
        'Partial Success',
        `${selected.length - totalFailed} items added. ${totalFailed} failed to save but will sync when possible.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else if (totalFailed === selected.length) {
      Alert.alert('Error', 'Failed to add items. Please try again.');
    } else {
      // All succeeded
      router.back();
    }
  }, [ingredients, household?.id, user?.id, router]);

  // ---- Retry ----

  const handleRetry = useCallback(() => {
    setErrorMessage('');
    setErrorFromYoutube(false);
    setPhase('input');
  }, []);

  const switchToTextMode = useCallback(() => {
    setMode('text');
    setErrorMessage('');
    setErrorFromYoutube(false);
    setPhase('input');
  }, []);

  // =============== RENDER ===============

  // ---- Input phase ----
  if (phase === 'input') {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-neutral-bg"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 py-4"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-4 items-center">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-brand-light">
              <Ionicons name="restaurant-outline" size={32} color={colors.brand.DEFAULT} />
            </View>
            <Text className="text-lg font-heading text-neutral-text">Import Recipe</Text>
            <Text className="mt-1 text-center text-sm text-neutral-secondary">
              Extract ingredients from a video or text
            </Text>
          </View>

          {/* Mode toggle tabs */}
          <View className="mb-4 flex-row rounded-xl bg-white border border-neutral-border overflow-hidden">
            <Pressable
              className={`flex-1 flex-row items-center justify-center py-3 ${
                mode === 'youtube' ? 'bg-brand' : 'bg-white'
              }`}
              onPress={() => setMode('youtube')}
            >
              <Ionicons
                name="logo-youtube"
                size={18}
                color={mode === 'youtube' ? '#fff' : colors.brand.DEFAULT}
              />
              <Text
                className={`ml-2 text-sm font-heading-semi ${
                  mode === 'youtube' ? 'text-white' : 'text-brand'
                }`}
              >
                YouTube Link
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 flex-row items-center justify-center py-3 ${
                mode === 'text' ? 'bg-brand' : 'bg-white'
              }`}
              onPress={() => setMode('text')}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={mode === 'text' ? '#fff' : colors.brand.DEFAULT}
              />
              <Text
                className={`ml-2 text-sm font-heading-semi ${
                  mode === 'text' ? 'text-white' : 'text-brand'
                }`}
              >
                Paste Recipe
              </Text>
            </Pressable>
          </View>

          {/* YouTube URL input */}
          {mode === 'youtube' && (
            <View className="mb-4">
              <TextInput
                className="font-sans rounded-xl border-2 border-neutral-border bg-white px-4 py-3.5 text-base text-neutral-text"
                placeholder="Paste YouTube video URL"
                placeholderTextColor={colors.neutral.tertiary}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={() => !isInputEmpty && handleExtract()}
              />
            </View>
          )}

          {/* Text paste input */}
          {mode === 'text' && (
            <View className="mb-4">
              <TextInput
                className="font-sans rounded-xl border-2 border-neutral-border bg-white px-4 py-3 text-base text-neutral-text"
                placeholder="Paste or type the ingredient list..."
                placeholderTextColor={colors.neutral.tertiary}
                value={text}
                onChangeText={(v) => setText(v.slice(0, 5000))}
                multiline
                numberOfLines={8}
                maxLength={5000}
                textAlignVertical="top"
                style={{ minHeight: 160 }}
              />
              <Text className="mt-1 text-right text-xs text-neutral-tertiary">
                {text.length.toLocaleString()} / 5,000
              </Text>
            </View>
          )}

          {/* Extract button */}
          <Pressable
            className={`flex-row items-center justify-center rounded-2xl py-4 ${
              isInputEmpty ? 'bg-neutral-tertiary' : 'bg-brand active:bg-brand-dark'
            }`}
            onPress={handleExtract}
            disabled={isInputEmpty}
          >
            <Ionicons name="sparkles-outline" size={22} color="#fff" />
            <Text className="ml-2 text-lg font-heading text-white">
              Extract Ingredients
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ---- Loading phase ----
  if (phase === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-6">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        <Text className="mt-4 text-base text-neutral-secondary">
          Extracting ingredients...
        </Text>
        <Text className="mt-1 text-sm text-neutral-tertiary">
          {mode === 'youtube' ? 'Fetching video captions and analyzing...' : 'Analyzing text...'}
        </Text>
      </View>
    );
  }

  // ---- Error phase ----
  if (phase === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-bg px-6">
        <View className="w-full rounded-2xl bg-red-50 px-5 py-6">
          <View className="mb-3 flex-row items-center">
            <Ionicons name="alert-circle" size={22} color={colors.semantic.error} />
            <Text className="ml-2 text-base font-heading-semi text-red-700">
              Extraction Failed
            </Text>
          </View>
          <Text className="text-sm text-red-600">{errorMessage}</Text>
        </View>

        {/* Retry button */}
        <Pressable
          className="mt-6 w-full flex-row items-center justify-center rounded-2xl border-2 border-brand bg-white py-4 active:bg-brand-light"
          onPress={handleRetry}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.brand.DEFAULT} />
          <Text className="ml-2 text-base font-heading-semi text-brand">Try Again</Text>
        </Pressable>

        {/* Fallback hint for YouTube mode */}
        {errorFromYoutube && (
          <Pressable
            className="mt-3 w-full flex-row items-center justify-center rounded-2xl border-2 border-brand bg-white py-4 active:bg-brand-light"
            onPress={switchToTextMode}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.brand.DEFAULT} />
            <Text className="ml-2 text-base font-heading-semi text-brand">
              Paste Ingredients Manually
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ---- Review phase ----
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 pb-32"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe title */}
        {recipeTitle && (
          <View className="mb-3 rounded-xl bg-brand-light px-4 py-3">
            <Text className="text-center text-sm text-brand-dark">Recipe</Text>
            <Text className="text-center text-base font-heading-semi text-brand-dark">
              {recipeTitle}
            </Text>
          </View>
        )}

        {/* Selection controls */}
        <View className="mb-2 flex-row items-center justify-between px-1">
          <Text className="text-sm text-neutral-secondary">
            {selectedCount} of {ingredients.length} ingredient
            {ingredients.length !== 1 ? 's' : ''} selected
          </Text>
          <Pressable onPress={toggleSelectAll} hitSlop={8}>
            <Text className="text-sm font-heading-semi text-brand">
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>
        </View>

        {/* Ingredient list */}
        <View className="rounded-xl border border-neutral-border overflow-hidden">
          {ingredients.map((ing, index) => (
            <Pressable
              key={`${ing.name}-${index}`}
              className={`flex-row items-center bg-white px-4 py-3 active:bg-neutral-surface ${
                index < ingredients.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onPress={() => toggleIngredient(index)}
            >
              {/* Checkbox */}
              <View
                className={`mr-3 h-6 w-6 items-center justify-center rounded-md border-2 ${
                  ing.selected
                    ? 'border-brand bg-brand'
                    : 'border-neutral-tertiary bg-white'
                }`}
              >
                {ing.selected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>

              {/* Ingredient details */}
              <View className="flex-1">
                <Text
                  className={`text-base font-sans ${
                    ing.selected ? 'text-neutral-text' : 'text-neutral-tertiary'
                  }`}
                >
                  {ing.name}
                </Text>
                {(ing.quantity || ing.unit) && (
                  <Text className="text-sm text-neutral-secondary">
                    {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Sticky bottom action */}
      <View className="border-t border-neutral-border bg-[#F5F0EB] px-4 pb-6 pt-3">
        <Pressable
          className={`flex-row items-center justify-center rounded-2xl py-4 ${
            selectedCount === 0 || inserting
              ? 'bg-neutral-tertiary'
              : 'bg-brand active:bg-brand-dark'
          }`}
          onPress={handleAddSelected}
          disabled={selectedCount === 0 || inserting}
        >
          {inserting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="add-circle" size={22} color="#fff" />
          )}
          <Text className="ml-2 text-lg font-heading text-white">
            {inserting
              ? 'Adding...'
              : `Add ${selectedCount} Item${selectedCount !== 1 ? 's' : ''} to List`}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
