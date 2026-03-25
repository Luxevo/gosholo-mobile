// Deep link URL generation utilities
import Share from 'react-native-share';

const WEB_DOMAIN = 'https://app.gosholo.com';
const APP_SCHEME = 'gosholomobile';

export type DeepLinkType = 'offer' | 'event' | 'commerce';

/**
 * Generate a universal link URL (for sharing externally)
 * Opens in app if installed, otherwise opens web page
 */
export const getUniversalLink = (type: DeepLinkType, id: string): string => {
  return `${WEB_DOMAIN}/${type}-mobile/${id}`;
};

/**
 * Generate an app scheme URL (for internal use)
 */
export const getAppSchemeLink = (type: DeepLinkType, id: string): string => {
  return `${APP_SCHEME}://${type}/${id}`;
};

/**
 * Generate share message with deep link
 */
export const getShareMessage = (params: {
  type: DeepLinkType;
  id: string;
  title: string;
  businessName?: string;
  description?: string;
}): { message: string; title: string; url: string } => {
  const { type, id, title, businessName, description } = params;
  const url = getUniversalLink(type, id);

  let message = title;
  if (businessName) {
    message += `\n${businessName}`;
  }
  if (description) {
    // Truncate description if too long
    const truncated = description.length > 100
      ? description.substring(0, 100) + '...'
      : description;
    message += `\n${truncated}`;
  }

  return {
    message,
    title,
    url,
  };
};

/**
 * Open share sheet with all options
 */
export const openShareSheet = async (params: {
  message: string;
  title: string;
  url?: string;
}): Promise<boolean> => {
  try {
    const { message, title, url } = params;
    const shareOptions: any = {
      message: url || message,
      title,
    };

    await Share.open(shareOptions);
    return true;
  } catch (error) {
    console.log('Share error:', error);
    return false;
  }
};

