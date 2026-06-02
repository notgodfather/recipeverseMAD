import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import { categories } from '../../constants/categories';

// ─── Types ────────────────────────────────────────────────────
interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Step {
  id: string;
  text: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  imageUri: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: 'Easy' | 'Medium' | 'Pro';
  ingredients: Ingredient[];
  steps: Step[];
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  tip: string;
}

const DIFFICULTY_OPTIONS: Array<'Easy' | 'Medium' | 'Pro'> = ['Easy', 'Medium', 'Pro'];
const UNITS = ['g', 'ml', 'cup', 'tbsp', 'tsp', 'pcs', 'oz', 'lb', 'pinch'];

const DIFFICULTY_COLOR = { Easy: '#2E7D32', Medium: '#F57C00', Pro: '#B43015' };
const STEPS_TOTAL = 4;

// ─── Sub-components ───────────────────────────────────────────
const SectionTitle = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconBg}>
      <Ionicons name={icon as any} size={18} color={colors.primary} />
    </View>
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

const InputLabel = ({ label, required }: { label: string; required?: boolean }) => (
  <Text style={styles.inputLabel}>
    {label}{required ? <Text style={{ color: colors.primary }}> *</Text> : null}
  </Text>
);

export default function CreateRecipeScreen({ navigation }: any) {
  const { profile, firebaseUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const progressAnim = useRef(new Animated.Value(1 / STEPS_TOTAL)).current;

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    tags: [],
    imageUri: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'Easy',
    ingredients: [{ name: '', quantity: '', unit: 'g' }],
    steps: [{ id: '1', text: '' }],
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    tip: '',
  });

  const scrollRef = useRef<ScrollView>(null);

  // ── Helpers ────────────────────────────────────────────────
  const set = (field: keyof FormData, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const goToStep = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    Animated.timing(progressAnim, {
      toValue: next / STEPS_TOTAL,
      duration: 350,
      useNativeDriver: false,
    }).start();
  };

  // ── Validation per step ────────────────────────────────────
  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.title.trim()) return alert('Please enter a recipe title.') as any || false;
      if (!form.category) return alert('Please select a category.') as any || false;
      if (!form.description.trim()) return alert('Please add a short description.') as any || false;
    }
    if (step === 2) {
      const validIngredients = form.ingredients.filter((i) => i.name.trim());
      if (validIngredients.length === 0) return alert('Add at least one ingredient.') as any || false;
    }
    if (step === 3) {
      const validSteps = form.steps.filter((s) => s.text.trim());
      if (validSteps.length === 0) return alert('Add at least one preparation step.') as any || false;
    }
    return true;
  };

  // ── Image URL validation ─────────────────────────────────
  const isValidUrl = (url: string) =>
    url.startsWith('http://') || url.startsWith('https://');

  // ── Ingredients ────────────────────────────────────────────
  const addIngredient = () =>
    set('ingredients', [...form.ingredients, { name: '', quantity: '', unit: 'g' }]);

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...form.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    set('ingredients', updated);
  };

  const removeIngredient = (index: number) => {
    if (form.ingredients.length === 1) return;
    set('ingredients', form.ingredients.filter((_, i) => i !== index));
  };

  const cycleUnit = (index: number) => {
    const current = form.ingredients[index].unit;
    const next = UNITS[(UNITS.indexOf(current) + 1) % UNITS.length];
    updateIngredient(index, 'unit', next);
  };

  // ── Steps ──────────────────────────────────────────────────
  const addStep = () =>
    set('steps', [...form.steps, { id: Date.now().toString(), text: '' }]);

  const updateStep = (index: number, text: string) => {
    const updated = [...form.steps];
    updated[index] = { ...updated[index], text };
    set('steps', updated);
  };

  const removeStep = (index: number) => {
    if (form.steps.length === 1) return;
    set('steps', form.steps.filter((_, i) => i !== index));
  };

  // ── Publish ────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!validateStep()) return;
    setPublishing(true);
    try {
      const validIngredients = form.ingredients
        .filter((i) => i.name.trim())
        .map((i) => `${i.quantity} ${i.unit} ${i.name}`.trim());
      const validSteps = form.steps.filter((s) => s.text.trim()).map((s) => s.text.trim());

      // ── Image — use the pasted URL ─────
      let finalImageUri = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';

      if (form.imageUri && isValidUrl(form.imageUri)) {
        finalImageUri = form.imageUri.trim();
      }
      // ────────────────────────────────────────────────────────

      const recipeData = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        tags: [form.category, ...(form.difficulty !== 'Easy' ? [form.difficulty] : [])],
        imageUri: finalImageUri,
        type: 'wide',
        chefId: firebaseUser?.uid ?? 'anonymous',
        chefName: profile?.displayName ?? firebaseUser?.displayName ?? 'Chef',
        chefAvatar: profile?.photoURL ?? firebaseUser?.photoURL ?? '',
        prepTime: form.prepTime ? `${form.prepTime} mins` : 'N/A',
        cookTime: form.cookTime ? `${form.cookTime} mins` : 'N/A',
        servings: form.servings || '2',
        difficulty: form.difficulty,
        calories: form.calories ? `${form.calories} kcal` : null,
        macros: {
          protein: parseInt(form.protein) || 0,
          carbs: parseInt(form.carbs) || 0,
          fat: parseInt(form.fat) || 0,
        },
        ingredients: validIngredients,
        steps: validSteps,
        tip: form.tip.trim() || null,
        rating: 0,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'recipes'), recipeData);

      // Reset form and immediately redirect to feed
      setForm({
        title: '',
        description: '',
        category: '',
        tags: [],
        imageUri: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        difficulty: 'Easy',
        ingredients: [{ name: '', quantity: '', unit: 'g' }],
        steps: [{ id: '1', text: '' }],
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        tip: '',
      });
      setStep(1);

      navigation.navigate('Feed');
    } catch (e: any) {
      Alert.alert('Publish failed', e.message ?? 'Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render each step
  // ─────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      {/* Title */}
      <View style={styles.card}>
        <SectionTitle icon="create-outline" title="The Basics" subtitle="Give your recipe its identity" />

        <InputLabel label="Recipe Title" required />
        <TextInput
          style={[styles.input, form.title.length > 0 && styles.inputFilled]}
          placeholder="e.g. Saffron-Infused Risotto"
          placeholderTextColor="#B09090"
          value={form.title}
          onChangeText={(t) => set('title', t)}
          maxLength={80}
        />
        <Text style={styles.charCount}>{form.title.length}/80</Text>

        <InputLabel label="Short Description" required />
        <TextInput
          style={[styles.input, styles.textArea, form.description.length > 0 && styles.inputFilled]}
          placeholder="What makes this recipe special? Describe the flavours, the story..."
          placeholderTextColor="#B09090"
          value={form.description}
          onChangeText={(t) => set('description', t)}
          multiline
          maxLength={300}
        />
        <Text style={styles.charCount}>{form.description.length}/300</Text>
      </View>

      {/* Category */}
      <View style={styles.card}>
        <SectionTitle icon="pricetag-outline" title="Category" subtitle="Choose the best fit" />
        <View style={styles.chipGrid}>
          {categories.filter((c) => c !== 'All Recipes').map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, form.category === cat && styles.chipActive]}
              onPress={() => set('category', cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cover Photo */}
      <View style={styles.card}>
        <SectionTitle
          icon="image-outline"
          title="Cover Photo"
          subtitle="Paste an image URL for your recipe"
        />

        <InputLabel label="Image URL" />
        <TextInput
          style={[styles.input, form.imageUri.length > 0 && styles.inputFilled]}
          placeholder="https://images.unsplash.com/photo-..."
          placeholderTextColor="#B09090"
          value={form.imageUri}
          onChangeText={(t) => set('imageUri', t.trim())}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Live preview */}
        {form.imageUri.length > 10 ? (
          <View style={styles.urlPreviewContainer}>
            <Image
              source={{ uri: form.imageUri }}
              style={styles.urlPreview}
              resizeMode="cover"
            />
            <View style={styles.urlPreviewBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
              <Text style={styles.urlPreviewBadgeText}>
                Preview looks good!
              </Text>
            </View>
          </View>
        ) : form.imageUri.length > 5 && !isValidUrl(form.imageUri) ? (
          <Text style={styles.urlError}>
            ⚠️ Must be a full URL starting with https://
          </Text>
        ) : null}

        <Text style={styles.urlHint}>
          💡 Tip: Paste an image URL from Google, Unsplash, or anywhere else.
        </Text>
      </View>

      {/* Timing & difficulty */}
      <View style={styles.card}>
        <SectionTitle icon="timer-outline" title="Time & Difficulty" />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <InputLabel label="Prep Time (mins)" />
            <TextInput
              style={styles.input}
              placeholder="e.g. 15"
              placeholderTextColor="#B09090"
              value={form.prepTime}
              onChangeText={(t) => set('prepTime', t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.halfInput, { marginLeft: 12 }]}>
            <InputLabel label="Cook Time (mins)" />
            <TextInput
              style={styles.input}
              placeholder="e.g. 30"
              placeholderTextColor="#B09090"
              value={form.cookTime}
              onChangeText={(t) => set('cookTime', t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <InputLabel label="Servings" />
            <TextInput
              style={styles.input}
              placeholder="e.g. 4"
              placeholderTextColor="#B09090"
              value={form.servings}
              onChangeText={(t) => set('servings', t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <InputLabel label="Difficulty" />
        <View style={styles.difficultyRow}>
          {DIFFICULTY_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.difficultyChip,
                form.difficulty === d && { backgroundColor: DIFFICULTY_COLOR[d] },
              ]}
              onPress={() => set('difficulty', d)}
              activeOpacity={0.8}
            >
              <Text style={[styles.difficultyText, form.difficulty === d && { color: colors.white }]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.card}>
        <SectionTitle icon="list-outline" title="Ingredients" subtitle="Be precise — your readers will thank you" />

        {form.ingredients.map((ing, index) => (
          <View key={index} style={styles.ingredientCard}>
            <View style={styles.ingredientCardTop}>
              <Text style={styles.ingredientIndex}>{index + 1}</Text>
              {form.ingredients.length > 1 && (
                <TouchableOpacity onPress={() => removeIngredient(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={16} color="#B43015" />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={[styles.input, styles.inputFilled]}
              placeholder="Ingredient name (e.g. Arborio Rice)"
              placeholderTextColor="#B09090"
              value={ing.name}
              onChangeText={(t) => updateIngredient(index, 'name', t)}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputFilled, { flex: 1 }]}
                placeholder="Amount"
                placeholderTextColor="#B09090"
                value={ing.quantity}
                onChangeText={(t) => updateIngredient(index, 'quantity', t)}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={styles.unitPill} onPress={() => cycleUnit(index)} activeOpacity={0.7}>
                <Text style={styles.unitText}>{ing.unit}</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addRowButton} onPress={addIngredient} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addRowText}>Add Ingredient</Text>
        </TouchableOpacity>
      </View>

      {/* Macros */}
      <View style={styles.card}>
        <SectionTitle icon="nutrition-outline" title="Nutritional Info" subtitle="Per serving — all fields optional" />
        <View style={styles.macroGrid}>
          {[
            { field: 'calories' as const, label: 'Calories', unit: 'kcal', color: '#DE5A3D' },
            { field: 'protein' as const, label: 'Protein', unit: 'g', color: '#2E7D32' },
            { field: 'carbs' as const, label: 'Carbs', unit: 'g', color: '#F5A623' },
            { field: 'fat' as const, label: 'Fat', unit: 'g', color: '#9E9D24' },
          ].map(({ field, label, unit, color }) => (
            <View key={field} style={styles.macroBox}>
              <View style={[styles.macroColorBar, { backgroundColor: color }]} />
              <Text style={styles.macroLabel}>{label}</Text>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroInput}
                  placeholder="0"
                  placeholderTextColor="#C0A0A0"
                  value={form[field]}
                  onChangeText={(t) => set(field, t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={styles.macroUnit}>{unit}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.card}>
        <SectionTitle icon="git-branch-outline" title="Preparation Steps" subtitle="Walk your readers through it, one step at a time" />

        {form.steps.map((s, index) => (
          <View key={s.id} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepLabel}>Step {index + 1}</Text>
              {form.steps.length > 1 && (
                <TouchableOpacity onPress={() => removeStep(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 'auto' }}>
                  <Ionicons name="trash-outline" size={16} color="#B43015" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[styles.input, styles.textArea, styles.inputFilled]}
              placeholder={`Describe step ${index + 1} in detail...`}
              placeholderTextColor="#B09090"
              value={s.text}
              onChangeText={(t) => updateStep(index, t)}
              multiline
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addRowButton} onPress={addStep} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addRowText}>Add Step</Text>
        </TouchableOpacity>
      </View>

      {/* Pro Tip */}
      <View style={styles.card}>
        <SectionTitle icon="bulb-outline" title="Chef's Tip" subtitle="A pro tip that makes all the difference (optional)" />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. The secret is using room-temperature butter for a creamier sauce..."
          placeholderTextColor="#B09090"
          value={form.tip}
          onChangeText={(t) => set('tip', t)}
          multiline
          maxLength={300}
        />
      </View>
    </>
  );

  const renderStep4 = () => {
    const validIngredients = form.ingredients.filter((i) => i.name.trim());
    const validSteps = form.steps.filter((s) => s.text.trim());

    return (
      <View style={styles.card}>
        <SectionTitle icon="eye-outline" title="Preview & Publish" subtitle="Review your recipe before it goes live" />

        {/* Preview card */}
        <View style={styles.previewCard}>
          {form.imageUri ? (
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
          ) : (
            <View style={[styles.previewImage, styles.previewImageEmpty]}>
              <Ionicons name="image-outline" size={40} color="#C0A0A0" />
              <Text style={{ color: '#C0A0A0', fontFamily: fonts.inter.medium, marginTop: 8 }}>No photo added</Text>
            </View>
          )}

          <View style={styles.previewBody}>
            <Text style={styles.previewTitle}>{form.title || '(No title)'}</Text>
            <Text style={styles.previewChef}>
              by {profile?.displayName ?? firebaseUser?.displayName ?? 'You'}
            </Text>
            <Text style={styles.previewDescription} numberOfLines={3}>
              {form.description || '(No description)'}
            </Text>

            {/* Stats row */}
            <View style={styles.previewStats}>
              {form.prepTime ? (
                <View style={styles.previewStat}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.previewStatText}>{form.prepTime}m</Text>
                </View>
              ) : null}
              <View style={styles.previewStat}>
                <Ionicons name="flame-outline" size={14} color={DIFFICULTY_COLOR[form.difficulty]} />
                <Text style={[styles.previewStatText, { color: DIFFICULTY_COLOR[form.difficulty] }]}>
                  {form.difficulty}
                </Text>
              </View>
              {form.servings ? (
                <View style={styles.previewStat}>
                  <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.previewStatText}>{form.servings} servings</Text>
                </View>
              ) : null}
              {form.category ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{form.category}</Text>
                </View>
              ) : null}
            </View>

            {/* Ingredient count */}
            <View style={styles.previewCounts}>
              <Text style={styles.previewCountText}>
                🥘 {validIngredients.length} ingredient{validIngredients.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.previewCountText}>
                📋 {validSteps.length} step{validSteps.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Checklist */}
        <View style={styles.checklist}>
          {[
            { label: 'Title', ok: !!form.title.trim() },
            { label: 'Description', ok: !!form.description.trim() },
            { label: 'Category', ok: !!form.category },
            { label: 'Ingredients', ok: validIngredients.length > 0 },
            { label: 'Steps', ok: validSteps.length > 0 },
            { label: 'Cover Photo', ok: !!form.imageUri, optional: true },
            { label: 'Nutritional Info', ok: !!form.calories, optional: true },
          ].map(({ label, ok, optional }) => (
            <View key={label} style={styles.checklistRow}>
              <Ionicons
                name={ok ? 'checkmark-circle' : optional ? 'ellipse-outline' : 'alert-circle-outline'}
                size={18}
                color={ok ? '#2E7D32' : optional ? '#aaa' : '#B43015'}
              />
              <Text style={[styles.checklistLabel, !ok && !optional && { color: '#B43015' }]}>
                {label}{optional ? ' (optional)' : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Recipe</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            {Array.from({ length: STEPS_TOTAL }).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.progressSegment, step > i && styles.progressSegmentActive]}
                onPress={() => i < step && setStep(i + 1)}
                activeOpacity={0.7}
              />
            ))}
          </View>

          <View style={styles.stepLabels}>
            {['Basics', 'Ingredients', 'Steps', 'Review'].map((label, i) => (
              <Text key={label} style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        {/* ── Form ───────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>

        {/* ── Bottom navigation ──────────────────────────── */}
        <View style={styles.bottomBar}>
          {step > 1 && (
            <TouchableOpacity style={styles.backStepBtn} onPress={() => goToStep(step - 1)} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color={colors.text} />
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < STEPS_TOTAL ? (
            <TouchableOpacity
              style={[styles.nextBtn, step === 1 && { flex: 1 }]}
              onPress={() => { if (validateStep()) goToStep(step + 1); }}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.publishBtn, publishing && styles.btnDisabled]}
              onPress={handlePublish}
              disabled={publishing}
              activeOpacity={0.85}
            >
              {publishing ? (
                  <>
                    <ActivityIndicator color={colors.white} size="small" />
                    <Text style={styles.publishBtnText}>Publishing...</Text>
                  </>
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={18} color={colors.white} />
                  <Text style={styles.publishBtnText}>Publish Recipe</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: layout.spacing.l,
    paddingBottom: layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
    color: colors.text,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontFamily: fonts.inter.medium,
    fontSize: 10,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.primary,
    fontFamily: fonts.inter.bold,
  },

  scrollContent: { padding: layout.spacing.m, paddingBottom: 120 },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.xl,
    padding: layout.spacing.l,
    marginBottom: layout.spacing.m,
    shadowColor: '#3D2020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: layout.spacing.l,
  },
  sectionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: colors.text,
  },
  sectionSubtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Inputs
  inputLabel: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.text,
    marginBottom: 14,
  },
  inputFilled: {
    borderColor: '#D9B5A8',
    backgroundColor: '#FEF6F3',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 14,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  halfInput: { flex: 1 },

  // Category chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#FEF0EB' },
  chipText: { fontFamily: fonts.inter.semiBold, fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: colors.primary },

  // Photo upload
  photoUpload: {
    height: 180,
    borderRadius: layout.borderRadius.l,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.background,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoImageEmpty: { justifyContent: 'center', alignItems: 'center' },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  changePhotoText: { fontFamily: fonts.inter.bold, fontSize: 13, color: colors.white },
  // URL preview
  urlPreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  urlPreview: {
    width: '100%',
    height: 160,
  },
  urlPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  urlPreviewBadgeText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 12,
    color: '#2E7D32',
  },
  urlError: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: '#B43015',
    marginBottom: 8,
  },
  urlHint: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Difficulty
  difficultyRow: { flexDirection: 'row', gap: 10 },
  difficultyChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  difficultyText: { fontFamily: fonts.inter.bold, fontSize: 13, color: colors.textSecondary },

  // Ingredients
  ingredientCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingredientCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientIndex: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: colors.primary,
  },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF0EB',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 4,
    marginLeft: 10,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#D9B5A8',
  },
  unitText: { fontFamily: fonts.inter.bold, fontSize: 13, color: colors.primary },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addRowText: { fontFamily: fonts.inter.bold, fontSize: 13, color: colors.primary },

  // Macros
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  macroBox: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  macroColorBar: { height: 3, borderRadius: 2, marginBottom: 8 },
  macroLabel: {
    fontFamily: fonts.inter.bold,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  macroInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  macroInput: {
    fontFamily: fonts.inter.bold,
    fontSize: 26,
    color: colors.text,
    padding: 0,
    minWidth: 50,
  },
  macroUnit: { fontFamily: fonts.inter.medium, fontSize: 13, color: colors.textSecondary, marginBottom: 2 },

  // Steps
  stepCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: { fontFamily: fonts.inter.bold, fontSize: 12, color: colors.white },

  // Preview (step 4)
  previewCard: {
    borderRadius: layout.borderRadius.l,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  previewImage: { width: '100%', height: 180, resizeMode: 'cover' },
  previewImageEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2E8E4',
    height: 180,
  },
  previewBody: { padding: 14 },
  previewTitle: { fontFamily: fonts.inter.bold, fontSize: 20, color: colors.text, marginBottom: 4 },
  previewChef: { fontFamily: fonts.inter.medium, fontSize: 12, color: colors.primary, marginBottom: 8 },
  previewDescription: { fontFamily: fonts.inter.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  previewStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  previewStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewStatText: { fontFamily: fonts.inter.medium, fontSize: 12, color: colors.textSecondary },
  categoryPill: { backgroundColor: '#FEF0EB', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  categoryPillText: { fontFamily: fonts.inter.bold, fontSize: 11, color: colors.primary },
  previewCounts: { flexDirection: 'row', gap: 16 },
  previewCountText: { fontFamily: fonts.inter.medium, fontSize: 13, color: colors.textSecondary },
  checklist: { gap: 10 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checklistLabel: { fontFamily: fonts.inter.medium, fontSize: 14, color: colors.text },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: layout.spacing.l,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
    alignItems: 'center',
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  backStepText: { fontFamily: fonts.inter.bold, fontSize: 14, color: colors.text },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: { fontFamily: fonts.inter.bold, fontSize: 15, color: colors.white },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 14,
  },
  publishBtnText: { fontFamily: fonts.inter.bold, fontSize: 15, color: colors.white },
  btnDisabled: { opacity: 0.6 },

  // ── Gallery picker ─────────────────────────────────────
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: '#FFF2ED',
  },
  galleryButtonText: {
    fontFamily: fonts.inter.bold,
    fontSize: 14,
    color: colors.primary,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orDividerText: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
