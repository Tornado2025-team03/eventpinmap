# EventPinMap Native App �

EventPinMap の React Native アプリケーションです。[Expo](https://expo.dev) と [Expo Router](https://expo.github.io/router/) を使用して構築されています。

## 📋 前提条件

以下のツールがインストールされている必要があります：

- **Node.js** (v18 以上推奨)
- **pnpm** (v8 以上推奨)
- **Expo CLI** (`npm install -g @expo/cli`)

### モバイル開発環境 (任意)

#### iOS 開発

- **Xcode** (macOS のみ)
- **iOS Simulator** (Xcode に含まれています)

#### Android 開発

- **Android Studio**
- **Android SDK**
- **Android Emulator** または実機

## 🚀 セットアップ手順

### 1. 依存関係のインストール

プロジェクトのルートディレクトリ（`/native`）で以下を実行：

```bash
pnpm install
```

### 2. 開発サーバーの起動

```bash
pnpm start
```

または

```bash
npx expo start
# pnpm dlx expo start でも可
```

### 3. アプリの実行

開発サーバー起動後、以下のオプションが表示されます：

#### Web ブラウザで実行（推奨）

- ターミナルで `w` を押すか、ブラウザで `http://localhost:8081` にアクセス

#### モバイルデバイスで実行

- **Expo Go アプリ**をスマートフォンにインストール
- 表示される QR コードをスキャン

#### エミュレータ/シミュレータで実行

```bash
# iOS シミュレータ
pnpm ios

# Android エミュレータ
pnpm android
```

## 📱 利用可能なコマンド

| コマンド             | 説明                               |
| -------------------- | ---------------------------------- |
| `pnpm start`         | 開発サーバーを起動                 |
| `pnpm ios`           | iOS シミュレータでアプリを実行     |
| `pnpm android`       | Android エミュレータでアプリを実行 |
| `pnpm web`           | Web ブラウザでアプリを実行         |
| `pnpm lint`          | コードの品質をチェック             |
| `pnpm reset-project` | プロジェクトをリセット             |

## 🏗️ プロジェクト構造

```
native/
├── app/                    # アプリのメイン画面（Expo Router）
│   ├── (tabs)/            # タブナビゲーション
│   ├── _layout.tsx        # ルートレイアウト
│   └── +not-found.tsx     # 404 ページ
├── assets/                # 画像・フォントなどの静的ファイル
├── components/            # 再利用可能なReactコンポーネント
├── constants/             # 定数・設定
├── hooks/                 # カスタムReactフック
├── ios/                   # iOS 固有の設定
├── android/               # Android 固有の設定
└── scripts/               # ビルド・デプロイスクリプト
```

## 🔧 トラブルシューティング

### キャッシュクリア

```bash
npx expo start --clear
# または: pnpm dlx expo start --clear
```

### node_modules の再インストール

```bash
rm -rf node_modules
pnpm install
```

### iOS ビルドエラー

```bash
cd ios && pod install
```

### Android ビルドエラー

```bash
cd android && ./gradlew clean
```

## 🔗 参考リンク

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://expo.github.io/router/)
- [React Native Documentation](https://reactnative.dev/)
- [pnpm Documentation](https://pnpm.io/)

## 🤝 開発への参加

1. ブランチを作成: `git checkout -b feature/your-feature-name`
2. 変更をコミット: `git commit -m 'Add some feature'`
3. ブランチをプッシュ: `git push origin feature/your-feature-name`
4. Pull Request を作成

---

何か問題が発生した場合は、[Issues](https://github.com/Tornado2025-team03/eventpinmap/issues) で報告してください。

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
