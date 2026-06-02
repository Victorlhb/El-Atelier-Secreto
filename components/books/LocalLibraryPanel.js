import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, View } from "react-native";
import { AtelierButton } from "../ui/AtelierButton";
import { AtelierCard } from "../ui/AtelierCard";
import { palette, spacing, typography } from "../../constants/theme";

function formatCount(value) {
  return String(value || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function LocalLibraryPanel({ stats, state, loading, onImport, variant = "discover" }) {
  const isWorking = loading || state.status === "scanning" || state.status === "indexing";
  const sourceName = state.lastSourceLabel || "Biblioteca principal";
  const totalBooks = stats?.totalBooks || state.imported || 0;
  const totalSources = stats?.totalSources || (state.lastSourceLabel ? 1 : 0);

  if (variant === "library") {
    return (
      <AtelierCard tone="dark" style={styles.card}>
        <View style={styles.libraryRow}>
          <View style={styles.seal}>
            <Ionicons name="leaf-outline" size={42} color={palette.gold} />
          </View>
          <View style={styles.libraryCopy}>
            <Text style={styles.eyebrow}>Biblioteca local</Text>
            <Text style={styles.primaryValue}>{formatCount(totalBooks)}</Text>
            <Text style={styles.support}>Tomos reunidos</Text>
            <Text style={styles.supportAccent}>{formatCount(totalSources)} rutas activas</Text>
          </View>
          <View style={styles.sourcePanel}>
            <Text style={styles.sourceEyebrow}>Ultima fuente</Text>
            <Text style={styles.sourceName}>{sourceName}</Text>
            <Text style={styles.sourceDetail}>Carpeta del dispositivo</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {state.lastIndexedAt
              ? "La mesa local ya esta preparada para abrir y buscar tus tomos."
              : "Importa una carpeta y deja que el atelier ordene tus libros."}
          </Text>
          <AtelierButton
            label={isWorking ? "Importando..." : Platform.OS === "android" ? "Importar" : "Anadir"}
            onPress={onImport}
            disabled={isWorking}
            loading={isWorking}
            style={styles.compactButton}
          />
        </View>
      </AtelierCard>
    );
  }

  return (
    <AtelierCard tone="dark" style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="library-outline" size={34} color={palette.gold} />
        <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Biblioteca local</Text>
            <Text style={styles.title}>Tu biblioteca ya vive aqui</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <Metric icon="book-outline" value={formatCount(totalBooks)} label="Libros reunidos" />
        <Metric icon="folder-open-outline" value={formatCount(totalSources)} label="Carpetas" />
        <Metric icon="time-outline" value={sourceName === "Biblioteca principal" ? "Ahora" : sourceName} label="Ultima fuente" textOnly />
      </View>

      <AtelierButton
        label={isWorking ? "Reuniendo la biblioteca..." : Platform.OS === "android" ? "Importar carpeta local" : "Importar libros"}
        onPress={onImport}
        disabled={isWorking}
        loading={isWorking}
      />

      <Text style={styles.status}>
        {state.message || "Tu biblioteca permanece privada en este dispositivo y el buscador la consulta primero."}
      </Text>
    </AtelierCard>
  );
}

function Metric({ icon, value, label, textOnly = false }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={20} color={palette.gold} />
      <Text style={[styles.metricValue, textOnly && styles.metricValueSmall]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: "#D4AF67",
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontFamily: typography.labelFamily,
    fontWeight: "700",
  },
  title: {
    color: "#F7F0E2",
    fontSize: 20,
    lineHeight: 24,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(212,175,103,0.22)",
    paddingTop: spacing.md,
  },
  metricValue: {
    color: "#FAF2E5",
    fontSize: 28,
    lineHeight: 30,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
    textAlign: "center",
  },
  metricValueSmall: {
    fontSize: 18,
    lineHeight: 22,
  },
  metricLabel: {
    color: "#D6C7AF",
    fontSize: 12,
    textTransform: "uppercase",
    textAlign: "center",
    fontFamily: typography.labelFamily,
    letterSpacing: 1.2,
  },
  status: {
    color: "#D0C2AA",
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.bodyRegularFamily,
  },
  libraryRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  seal: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: "rgba(212,175,103,0.56)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  libraryCopy: {
    flex: 1,
    gap: 2,
  },
  primaryValue: {
    color: "#FBF2E4",
    fontSize: 42,
    lineHeight: 44,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  support: {
    color: "#E2D4BC",
    fontSize: 16,
    fontFamily: typography.bodySemiBoldFamily,
  },
  supportAccent: {
    color: "#95B57A",
    fontSize: 18,
    fontFamily: typography.bodySemiBoldFamily,
  },
  sourcePanel: {
    width: 124,
    padding: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,103,0.22)",
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 4,
  },
  sourceEyebrow: {
    color: "#D4AF67",
    fontSize: 11,
    textTransform: "uppercase",
    fontFamily: typography.labelFamily,
    letterSpacing: 1.1,
  },
  sourceName: {
    color: "#F7F0E2",
    fontSize: 16,
    lineHeight: 20,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
  },
  sourceDetail: {
    color: "#CABA9E",
    fontSize: 13,
    lineHeight: 17,
    fontFamily: typography.bodyRegularFamily,
  },
  footerRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  footerText: {
    flex: 1,
    color: "#D0C2AA",
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.bodyRegularFamily,
  },
  compactButton: {
    minWidth: 128,
  },
});
