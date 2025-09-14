export default {
  expo: {
    name: "Gourmet Cocktails",
    slug: "gourmet-cocktails",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.gourmetcocktails",
      buildNumber: "1",
      infoPlist: {
        UIBackgroundModes: [],
        NSCameraUsageDescription: "This app does not need camera access",
        NSPhotoLibraryUsageDescription: "This app does not need photo library access",
        NSMicrophoneUsageDescription: "This app does not need microphone access",
        NSLocationWhenInUseUsageDescription: "This app does not need location access"
      },
      // For App Store
      appStoreUrl: "https://apps.apple.com/app/yourappid",
      // If you plan to implement in-app purchases
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.yourcompany.gourmetcocktails",
      versionCode: 1,
      // For Play Store
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.yourcompany.gourmetcocktails",
      permissions: []
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "your-project-id"
      }
    },
    owner: "your-expo-account",
    // Privacy Policy and Terms of Service URLs (required for both stores)
    privacyPolicyUrl: "https://yourwebsite.com/privacy",
    termsOfServiceUrl: "https://yourwebsite.com/terms"
  }
};
