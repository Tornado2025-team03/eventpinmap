# Build Instructions

Follow these steps to build the Expo project for Android and iOS:

## 1. Clean and prebuild the project

```sh
npx expo prebuild --clean
```

## 2. Install EAS CLI globally (if not already installed)

```sh
npm install -g eas-cli
```

## 3. Build the app

### For Android (development profile):

```sh
eas build --profile development --platform android
```

### For iOS (development profile):

```sh
eas build --profile development --platform ios
```

## 4. Start the development server for the dev client

```sh
npx expo start --dev-client
```

> Make sure you have the necessary credentials and are logged in to your Expo account before running the build
