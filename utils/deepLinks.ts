// Deep link URL generation utilities
import { Platform } from 'react-native';
import Share, { Social } from 'react-native-share';

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
  message += `\n\n${url}`;

  return {
    message,
    title,
    url,
  };
};

/**
 * Share to Instagram Stories with an image
 */
export const shareToInstagramStories = async (imageUri: string, url?: string): Promise<boolean> => {
  try {
    const shareOptions = {
      stickerImage: imageUri,
      backgroundBottomColor: '#016167',
      backgroundTopColor: '#FF6233',
      attributionURL: url,
      social: Social.InstagramStories,
      appId: '', // Optional: Facebook App ID for attribution
    };
    await Share.shareSingle(shareOptions);
    return true;
  } catch (error) {
    console.log('Instagram Stories share error:', error);
    return false;
  }
};

/**
 * Share to Facebook Stories with an image
 */
export const shareToFacebookStories = async (imageUri: string, url?: string): Promise<boolean> => {
  try {
    const shareOptions = {
      stickerImage: imageUri,
      backgroundBottomColor: '#016167',
      backgroundTopColor: '#FF6233',
      attributionURL: url,
      social: Social.FacebookStories,
      appId: '', // Optional: Facebook App ID
    };
    await Share.shareSingle(shareOptions);
    return true;
  } catch (error) {
    console.log('Facebook Stories share error:', error);
    return false;
  }
};

/**
 * Share to WhatsApp with message and URL
 */
export const shareToWhatsApp = async (message: string, url?: string): Promise<boolean> => {
  try {
    const shareOptions: any = {
      message: message + (url ? `\n\n${url}` : ''),
      social: Social.Whatsapp,
    };
    await Share.shareSingle(shareOptions);
    return true;
  } catch (error) {
    console.log('WhatsApp share error:', error);
    return false;
  }
};

/**
 * Open share sheet with all options
 */
export const openShareSheet = async (params: {
  message: string;
  title: string;
  url?: string;
  imageUri?: string;
}): Promise<boolean> => {
  try {
    const { message, title, url, imageUri } = params;
    const shareOptions: any = {
      message,
      title,
    };

    if (url) {
      shareOptions.url = url;
    }

    if (imageUri) {
      shareOptions.urls = [imageUri];
    }

    await Share.open(shareOptions);
    return true;
  } catch (error) {
    console.log('Share error:', error);
    return false;
  }
};

/**
 * Check if Instagram is installed
 */
export const isInstagramAvailable = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') return true;
    const result = await Share.isPackageInstalled('com.instagram.android');
    return result?.isInstalled ?? false;
  } catch {
    return false;
  }
};

/**
 * Check if Facebook is installed
 */
export const isFacebookAvailable = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') return true;
    const result = await Share.isPackageInstalled('com.facebook.katana');
    return result?.isInstalled ?? false;
  } catch {
    return false;
  }
};
