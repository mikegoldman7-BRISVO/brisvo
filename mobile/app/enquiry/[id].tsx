import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { submitEnquiry } from "../../src/lib/artists";
import { PROJECT_TYPES } from "../../src/lib/content";
import { theme } from "../../src/lib/theme";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EnquiryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [projectType, setProjectType] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const isValid = useMemo(
    () => Boolean(name.trim() && EMAIL_PATTERN.test(email.trim()) && message.trim()),
    [name, email, message],
  );

  const onSubmit = async () => {
    if (!isValid || !id) return;

    setSubmitting(true);
    setError("");

    try {
      await submitEnquiry({
        artist_id: id,
        sender_name: name.trim(),
        sender_email: email.trim(),
        sender_company: company.trim(),
        project_type: projectType,
        message: message.trim(),
      });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your enquiry could not be sent.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.successScreen}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Enquiry sent</Text>
        <Text style={styles.successBody}>
          We&apos;ve received your enquiry and will be in touch shortly.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.submit} accessibilityRole="button">
          <Text style={styles.submitText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lede}>
          Tell us about the job and we&apos;ll come back with availability and a quote.
        </Text>

        <Field label="Your name" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Field label="Company (optional)" value={company} onChangeText={setCompany} />

        <Text style={styles.label}>Project type</Text>
        <View style={styles.chipWrap}>
          {PROJECT_TYPES.map(type => {
            const isActive = type === projectType;
            return (
              <Pressable
                key={type}
                onPress={() => setProjectType(isActive ? "" : type)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{type}</Text>
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Your brief"
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Tell us about your project…"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onSubmit}
          disabled={!isValid || submitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isValid || submitting }}
          style={[styles.submit, (!isValid || submitting) && styles.submitDisabled]}
        >
          <Text style={styles.submitText}>{submitting ? "Sending…" : "Send enquiry"}</Text>
        </Pressable>

        <Text style={styles.privacy}>
          Your details go only to BrisVO and the artist you contacted.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };

function Field({ label, multiline, style, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={theme.colors.textFaint}
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.inputMultiline, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  lede: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
  field: { gap: 6 },
  label: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 120, textAlignVertical: "top" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
  },
  chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  error: { color: theme.colors.danger, fontSize: 13 },
  submit: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  privacy: { color: theme.colors.textFaint, fontSize: 12, textAlign: "center" },
  successScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  successIcon: { color: theme.colors.accent, fontSize: 44 },
  successTitle: { color: theme.colors.text, fontSize: 24, fontFamily: theme.fonts.display },
  successBody: { color: theme.colors.textMuted, textAlign: "center", lineHeight: 21 },
});
