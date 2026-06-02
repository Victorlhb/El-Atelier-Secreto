import { Text, View } from "react-native";
import { useDownload } from "../../hooks/useDownload";
import { AtelierButton } from "../ui/AtelierButton";
import { ProgressBar } from "../ui/ProgressBar";

export function DownloadButton({ book }) {
  const { loading, progress, completed, startDownload } = useDownload(book);
  const isLocalBook = book.source === "local";

  return (
    <View style={{ gap: 8 }}>
      <AtelierButton
        label={
          isLocalBook
            ? "Disponible en dispositivo"
            : completed
              ? "Guardado en dispositivo"
              : loading
                ? "Guardando..."
                : "Guardar en dispositivo"
        }
        onPress={startDownload}
        disabled={completed}
        loading={loading}
      />
      {(loading || completed) && (
        <>
          <ProgressBar value={progress} />
          <Text style={{ color: "#655F54", fontSize: 12 }}>
            {isLocalBook
              ? "Indexado en la biblioteca local"
              : completed
                ? "Disponible en la biblioteca local"
                : `${Math.round(progress * 100)}% guardado`}
          </Text>
        </>
      )}
    </View>
  );
}
