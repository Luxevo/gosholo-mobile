import React from 'react';
import { Linking, Text, TextProps } from 'react-native';

interface LinkableTextProps extends Omit<TextProps, 'children'> {
  children: string;
  linkColor?: string;
}

/**
 * Composant qui rend le texte avec des liens cliquables.
 * Détecte automatiquement les URLs (http://, https://, www.) et les rend cliquables.
 */
export function LinkableText({ children, style, linkColor = '#016167', numberOfLines, ...props }: LinkableTextProps) {
  // Regex pour détecter les URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/g;

  if (!children) return null;

  const parts: (string | { text: string; url: string })[] = [];
  let lastIndex = 0;
  let match;

  // Trouver toutes les URLs dans le texte
  while ((match = urlRegex.exec(children)) !== null) {
    // Ajouter le texte avant l'URL
    if (match.index > lastIndex) {
      parts.push(children.substring(lastIndex, match.index));
    }

    // Ajouter l'URL
    let url = match[0];
    // Ajouter https:// si l'URL n'a pas déjà un protocole
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else {
        // Pour les domaines simples comme "facebook.com", ajouter https://
        url = 'https://' + url;
      }
    }
    parts.push({ text: match[0], url });

    lastIndex = match.index + match[0].length;
  }

  // Ajouter le texte restant après la dernière URL
  if (lastIndex < children.length) {
    parts.push(children.substring(lastIndex));
  }

  // Si aucune URL n'a été trouvée, retourner le texte normal
  if (parts.length === 0 || (parts.length === 1 && typeof parts[0] === 'string')) {
    return <Text style={style} numberOfLines={numberOfLines} {...props}>{children}</Text>;
  }

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('Erreur lors de l\'ouverture du lien:', err);
    });
  };

  return (
    <Text style={style} numberOfLines={numberOfLines} {...props}>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <Text key={index}>{part}</Text>;
        } else {
          return (
            <Text
              key={index}
              style={{ color: linkColor, textDecorationLine: 'underline' }}
              onPress={() => handleLinkPress(part.url)}
            >
              {part.text}
            </Text>
          );
        }
      })}
    </Text>
  );
}

