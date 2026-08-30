import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark } from "../../src/components/Brand";
import { subscribeToNewsletter } from "../../src/lib/artists";
import {
  ABOUT_PARAGRAPHS,
  ABOUT_QUOTE,
  ABOUT_TAGLINE,
  OFFER_ITEMS,
  RATE_CARD_URL,
  STUDIOS,
  WEBSITE_URL,
} from "../../src/lib/content";
import { theme } from "../../src/lib/theme";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function openUrl(url: string) {
  WebBrowser.openBrowserAsync(url).catch(() => {
    Linking.openURL(url).catch(() => {});
  });
}

export default function InfoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <BrandMark />
      <Text style={styles.tagline}>{ABOUT_TAGLINE}</Text>

      {ABOUT_PARAGRAPHS.map(paragraph => (
        <Text key={paragraph} style={styles.body}>
          {paragraph}
        </Text>
      ))}

      <Text style={styles.quote}>&ldquo;{ABOUT_QUOTE}&rdquo;</Text>

      <View style={styles.offers}>
        {OFFER_ITEMS.map(offer => (
          <View key={offer.title} style={styles.offer}>
            <Text style={styles.offerIcon}>{offer.icon}</Text>
            <View style={styles.offerText}>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerBody}>{offer.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => openUrl(RATE_CARD_URL)}
        accessibilityRole="link"
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>View the rate card</Text>
      </Pressable>

      <NewsletterSignup />

      <Text style={styles.sectionTitle}>Studio links</Text>
      <Text style={styles.sectionLede}>
        Brisbane studios our talent record in and recommend.
      </Text>

      {STUDIOS.map(studio => (
        <View key={studio.name} style={styles.studio}>
          <Text style={styles.studioName}>{studio.name}</Text>
          <Text style={styles.studioBody}>{studio.description}</Text>
          {studio.location ? <Text style={styles.studioMeta}>{studio.location}</Text> : null}

          {studio.website ? (
            <Pressable
              onPress={() => openUrl(`https://${studio.website}`)}
              accessibilityRole="link"
            >
              <Text style={styles.link}>{studio.website}</Text>
            </Pressable>
          ) : null}

          {studio.contacts.map((contact, index) => (
            <View key={`${studio.name}-contact-${index}`} style={styles.contact}>
              {contact.name ? <Text style={styles.studioMeta}>{contact.name}</Text> : null}
              {contact.email ? (
                <Pressable
                  onPress={() => Linking.openURL(`mailto:${contact.email}`).catch(() => {})}
                  accessibilityRole="link"
                >
                  <Text style={styles.link}>{contact.email}</Text>
                </Pressable>
              ) : null}
              {contact.phone ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(`tel:${contact.phone!.replace(/\s/g, "")}`).catch(() => {})
                  }
                  accessibilityRole="link"
                >
                  <Text style={styles.link}>{contact.phone}</Text>
                </Pressable>
              ) : null}
              {contact.note ? <Text style={styles.studioMeta}>{contact.note}</Text> : null}
            </View>
          ))}
        </View>
      ))}

      <Pressable onPress={() => openUrl(WEBSITE_URL)} accessibilityRole="link">
        <Text style={styles.footer}>brisvo.com</Text>
      </Pressable>
    </ScrollView>
  );
}

function NewsletterSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const isValid = name.trim().length > 0 && EMAIL_PATTERN.test(email.trim());

  const onSubmit = async () => {
    if (!isValid) return;
    setStatus("sending");
    setError("");

    try {
      await subscribeToNewsletter(name.trim(), email.trim());
      setStatus("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-up failed. Try again.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <View style={styles.newsletter}>
        <Text style={styles.newsletterTitle}>You&apos;re on the list</Text>
        <Text style={styles.body}>
          Thanks {name.trim().split(" ")[0]} — we&apos;ll be in touch with all things BrisVO.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.newsletter}>
      <Text style={styles.newsletterTitle}>Have you heard?</Text>
      <Text style={styles.body}>
        News, events, membership opportunities and promotions. No spam, unsubscribe anytime.
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={theme.colors.textFaint}
        style={styles.input}
        accessibilityLabel="Your name"
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email address"
        placeholderTextColor={theme.colors.textFaint}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        accessibilityLabel="Email address"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={onSubmit}
        disabled={!isValid || status === "sending"}
        accessibilityRole="button"
        style={[styles.primaryButton, (!isValid || status === "sending") && styles.disabled]}
      >
        <Text style={styles.primaryButtonText}>
          {status === "sending" ? "Signing up…" : "Sign up"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  tagline: {
    color: theme.colors.text,
    fontSize: 24,
    fontFamily: theme.fonts.display,
    lineHeight: 32,
    marginTop: 6,
  },
  body: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 23 },
  quote: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 23,
    fontStyle: "italic",
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
    paddingLeft: 14,
  },
  offers: { gap: 12, marginTop: 4 },
  offer: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  offerIcon: { fontSize: 20, width: 26 },
  offerText: { flex: 1, gap: 2 },
  offerTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  offerBody: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 13,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.4 },
  newsletter: {
    gap: 10,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    marginTop: 6,
  },
  newsletterTitle: { color: theme.colors.text, fontSize: 20, fontFamily: theme.fonts.display },
  input: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: { color: theme.colors.danger, fontSize: 13 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: theme.fonts.display,
    marginTop: 12,
  },
  sectionLede: { color: theme.colors.textMuted, fontSize: 14, marginTop: -6 },
  studio: {
    gap: 5,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  studioName: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  studioBody: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 },
  studioMeta: { color: theme.colors.textFaint, fontSize: 12 },
  contact: { gap: 2, marginTop: 4 },
  link: { color: theme.colors.accent, fontSize: 13 },
  footer: {
    color: theme.colors.textFaint,
    textAlign: "center",
    marginTop: 16,
    letterSpacing: 1.5,
  },
});
