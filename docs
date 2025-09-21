# 0. ブランド / ネーミング
- **製品名**：**HikariWeave — Video Synth Studio**
- **タグライン（EN）**：*Weave light from sound. Anyone can play.*
- **タグライン（JP）**：*音で光を織る、誰でも演奏できる映像。*
- **ロゴ方針（初期）**：幾何サンセリフ（Inter/Geist系の角丸）＋発光する細線の織り。モーションは“発光バーが脈動→グロー→残像”。
- **ブランドカラー（初期）**：
  - Neon：#7DF9FF（シアン） / #B26EFF（パープル） / #FF6EC7（ピンク）
  - Warm：#F6C453（ゴールド） / #FFB169（アンバー）
  - Base：#0B0B0E（Near Black） / #111319（Panel）
- **トーン**：未来的・洗練・直感操作（“誰でも即かっこいい”を前面に）。

# 1. 概要 / 目的
- ブラウザ上で動作する**ビデオシンセサイザー**を中核に、以下4モードを一体化したアプリを提供する：
  - **Live**（照明的ビジュアライザー）
  - **Sculpt**（音で“成長”する造形）
  - **MV**（曲からミュージックビデオを生成）
  - **Mapping**（投影範囲/コーナーピン・複数面）
- **共通コア**：Audio解析 → モジュレーション・マトリクス → レンダラー。
- **用途**：アーティストのライブ演出、ブランドの体験型キャンペーン、MV背景生成。
- **“黒背景＝光らない”**を含む複数背景モードを持ち、プロジェクターでの照明化にも対応。

---

# 2. ターゲット / 利用シーン
- **アーティスト/DJ/VJ**：会場投影、配信、ショートクリップ生成。
- **企業/ブランド**：LP埋め込み、展示・ポップアップでの参加型体験、ブランドカラー運用。

---

# 3. アーキテクチャ（論理）
## 3.1 Core Engine（共通）
- **Audio I/O**：Live（マイク/オーディオIF）、File（mp3/wav）、Tab（getDisplayMedia）。
- **Analyzer**：FFT(1024/2048)、RMS/Peak、Low/Mid/High、Onset(kick/snare/hh)、BPM、スペクトル重心、ピッチ/クロマ。
- **Mod Matrix**：Source（音特徴）→ Transform（Env/Curve/Range/Gate/Jitter）→ Target（Motion/Shape/Color/FX/Material/Mask）。
- **Renderer**：GLSL/Particles/SDF（WebGL2）、合成（加算/スクリーン/Max）、Bloom/Glow、線密度スイッチ。
- **Background**：`Black | Solid | Gradient | Pattern`（黒は“照明”用途）。
- **Preset/Scene**：パラメータ保存・共有（Firestore）。

## 3.2 Modes（プラグイン化、遅延ロード）
- **Live**：BEAM / WAVE / PARTICLES（＋拡張：FRACTAL GOBO / TYPO SPECTRO）。
- **Sculpt**：BioCircuit / Crystal Loom / AeroMorph（自然×人工×未来、過程を可視化）。
- **MV**：曲インポート→自動セクション分割→テンプレ配置→編集→高品質書き出し。
- **Mapping**：マスク（矩形/多角形/ロゴ画像）、コーナーピン、複数面アサイン。
- **Code Overlay**（共通レイヤ）：Off / Minimal / Full、GhostType/Highlight/WirePatch/MatrixRain など。

## 3.3 UIレイアウト
- **Studioビュー**（編集・作成）：
  - 左：キャンバス
  - 右：パネル（Mod Matrix / Color&Background / Modeパネル / Audio設定 / Code Overlay）
  - 下：Scene 1–8（拍クロスフェード0.5–4s）、Macro 4ノブ（Energy/Density/Purity/Glow）
- **Stageビュー**（本番）：
  - ミニマル：Macro 4ノブ＋Scene 8ボタン＋コード表示トグル＋フルスクリーン

---

# 4. 機能要件
## 4.1 Audio 入力
- **Live**：`getUserMedia({audio:true})`、デバイス選択（オーディオIF対応）。
  - 推奨設定：echoCancellation / noiseSuppression / autoGainControl = OFF。
  - Trim（-24〜+24dB）、Limiter（Look-ahead簡易）、Mono/L/R/ステレオ選択。
- **File**：mp3/wavドラッグイン、ループ/再生位置、内部SRへ統一。
- **Tab**：`getDisplayMedia({audio:true})`（Chrome系）。
- **保存**：最終選択のデバイス/設定をLocalStorage。

## 4.2 Analyzer
- FFT 1024/2048（切替）、RMS/Peak、Low/Mid/Highスプリット（クロスオーバー可変）。
- Onset（スペクトルフラックス＋適応閾値）、BPM（簡易）、スペクトル重心、ピッチ/クロマ。

## 4.3 Mod Matrix（ライブで映しても“作品”）
- **Source**：Low/Mid/High/RMS/Peak/Onset/BPM/重心/ピッチ。
- **Transform**：Env(Attack/Decay/Hold)、Curve（Lin/Exp/Log/Quantize）、Range(Min/Max/Polarity)、Gate/Trigger、Jitter。
- **Target**：
  - Motion：位置/回転/ズーム/タイル/シェイク
  - Shape：波形ブレンド(sine/saw/triangle/square/pulse/noise)/頂点数/PWM/ノイズ/ドメインワープ
  - Color/Light：Hue/Sat/Val/GradientPos/Bloom/温度
  - FX：ストロボ/ブラー/エッジ/グリッチ/色収差
  - Material：Fresnel/ラフネス/メタリック
  - Mask：開閉/フェザー/回転
- **表示**：マトリクスのセル自体が発光バーで脈動。Nodeパッチ表示（切替可）。

## 4.4 Visual Presets（Live）
- **BEAM**：低域→スケール&Bloom、高域→ストロボ、重心→Hue。
- **WAVE**：低域→振幅、中域→ドメインワープ、高域→モアレ。
- **PARTICLES**：低域→密度、中域→筆圧、高域→スパーク。
- （拡張）FRACTAL GOBO / TYPO SPECTRO。

## 4.5 Sculpt（過程を魅せる）
- **BioCircuit**（葉脈×回路）／**Crystal Loom**（結晶×織物）／**AeroMorph**（貝殻×メタ素材）。
- 成長は**リアルタイム**（拍ごとにステップ）、Scaffold/Trails/BuildTicksの可視化トグル。
- 音特徴→成長要因：低域=体積/太さ、中域=分岐/曲率、高域=細線/縁の輝き、RMS=露光、重心=Hue、ピッチ=方向。

## 4.6 MVモード
- **インポート**：音源(mp3/wav)、（任意）歌詞(LRC/テキスト)、アスペクト 16:9 / 9:16 / 1:1（**縦横の向き切替**対応）。
- **自動解析**：BPM/Onset/セクション推定/重心。
- **ストーリーボード**：セクション別にプリセット割当、カメラ演出を小節量子化。
- **コード表示**：Off/Minimal/Full（デフォルトは後述・切替可）。
- **書き出し**：プレビュー（60fps目標）、オフラインレンダ（**1080p60 WebM**／4K30はPro）。**書き出し時にもアスペクトと縦横を選択可能**。WebM未対応環境にはガイド（再生互換と変換手順）。


## 4.7 Mapping
- マスク：矩形/多角形/画像マスク（PNG/アルファ）。
- 変形：コーナーピン（4点ホモグラフィ）。
- 複数面：面ごとにプリセット割当、同一Audio/Matrixを共有 or 分岐選択。

## 4.8 Code Overlay
- **Modes**：GhostType / ReactiveHighlight / ShaderScope / WirePatch / MatrixRain。
- **表示**：Off / Minimal / Full、Opacity/位置/背景。**デフォルト=Off（ワンクリックで切替可能）**。
- **フェイルセーフ**：負荷増で自動Minimal。
- **フェイルセーフ**：負荷増で自動Minimal。

## 4.9 Color / Background
- パレット：Neon / Warm / Corporate / Mono。A/Bピッカー。
- 背景：Black（照明）/ Solid / Gradient / Pattern。**初期値：Live=Black、MV=Gradient、Sculpt=Neon（いずれもUIで変更可）**。
- ガード：ブランド用に色域・明度の上下限ロック機能（Enterprise）。
- ガード：ブランド用に色域・明度の上下限ロック機能（Enterprise）。

## 4.10 操作・ホットキー
- `Space`=Start/Stop, `F`=FullScreen, `1..5`=プリセット, `C`=コード表示切替。
- Macro 4ノブ（Energy/Density/Purity/Glow）、Scene 1–8（拍クロスフェード）。

---

# 5. 非機能要件
- **パフォーマンス**：1080pで60fps目標（最低30fps）、Audio→映像の体感遅延<80ms。
- **フェイルセーフ**：FPS低下で粒子数/線密度→Bloom優先へ段階的縮退。
- **対応ブラウザ**：Chrome / Edge / **Firefox / Safari** を**正式サポート目標**。機能は **Progressive Enhancement** 方針：Tab音声は当面Chrome系優先、Safari/iOSは`AudioContext.resume()`等の制約に合わせて自動ガイドとフォールバック（OffscreenCanvas未対応時は通常Canvasへ）。
- **PWA**：インストール可、オフライン起動（ローカル処理）。
- **プライバシー**：デフォルトで音/映像のクラウド送信なし（解析はローカル）。
- **安全**：ストロボ上限Hz・注意文、音入力のピーク検知・自動リミット。
- **PWA**：インストール可、オフライン起動（ローカル処理）。
- **プライバシー**：デフォルトで音/映像のクラウド送信なし（解析はローカル）。
- **安全**：ストロボ上限Hz・注意文、音入力のピーク検知・自動リミット。

---

# 6. データ / バックエンド（Firebase）
## 6.1 Firestore モデル（初版）
```
rooms/{roomId}
  name, createdBy, createdAt, updatedAt

rooms/{roomId}/params/global
  waveform: "sine"|"saw"|"triangle"|"square"|"pulse"|"noise"
  freq: number, speed: number, pwm: number
  brightness: number, contrast: number
  gradientA: { h:number, s:number, v:number }
  gradientB: { h:number, s:number, v:number }
  background: { type:"black"|"solid"|"gradient"|"pattern", a?:color, b?:color }
  matrix: { /* Source→Targetの割当＆Transform設定 */ }
  presetId?: string

rooms/{roomId}/members/{uid}
  displayName, color, lastActive

presets/{presetId}
  name, author, isPublic, params:{...}
  tags?: string[], createdAt, updatedAt
```

## 6.2 セキュリティ/運用
- 匿名Auth（保存時に紐付け）。
- ルーム作成者のみ更新可（本番）・開発中は緩和。地域は`asia-northeast1`推奨。
- Storage：ロゴ/マスク画像、MV書き出し（任意）。
- **データ保持（初期上限）**：プリセット100件/ユーザー、公開プリセット500件/全体、ルーム設定50件/ルーム（運用で調整可）。


---

# 7. マネタイズ
- **Free**：Live基本プリセット、1080pプレビュー。
- **Pro**：Sculpt/MV/Mapping、保存数拡大、1080p/4K書き出し。
- **Enterprise**：Brand Kit（色域/ロゴガード）、DMX/Art-Net、SSO、埋め込みSDK。

---

# 8. 品質/受け入れ基準（抜粋）
1. 1080pで30fps以上、Live/MV/Sculptで体感遅延<80ms。
2. 黒背景は完全黒（0,0,0）を維持（照明用途で“光らない”）。
3. Live：BEAM/WAVE/PARTICLESの3プリセットで明確に異なる見た目。
4. Sculpt：3プリセットで**成長過程の可視**（Scaffold/Trails/BuildTicks）。
5. MV：曲インポート→自動シーン割当→1080p書き出しが完了。
6. Mapping：マスク1面＋コーナーピンで投影面に合わせられる。
7. Mod Matrix：帯域→動き/形/色/FX の割当と量/カーブ/Gateが操作・保存可能。
8. Code Overlay：Off/Minimal/Fullの切替、Minimalでイベント連動ハイライト。

---

# 9. 開発フェーズ
- **P1 Core+Live**：Audio I/O、Analyzer、Mod Matrix、BEAM/WAVE/PARTICLES、コードOverlay、Studio/Stage。
- **P2 Mapping**：マスク/コーナーピン、背景モード一式。
- **P3 Sculpt**：3プリセット＋過程表示、Macro調整。
- **P4 MV**：解析/セクション/テンプレ/書き出し。
- **P5 拡張**：Brand Kit、DMX/Art-Netプラグイン、埋め込みSDK。

---

# 10. UIスタイルガイド（抜粋）
- ダークNeonスキン：角丸2xl、微グロー、柔らかいシャドウ。フォントは幾何系。
- マトリクス/ノードは**シグナルの太さ/色**で“効き具合”を可視化。
- パネルはグリッド整列、タップ領域は最小40px、キーボードショートカット明示。

---

# 11. テスト計画（概要）
- **性能**：1080p/60fps、低スペック時の縮退確認。
- **互換**：Chrome/Edge/Safari、USBオーディオIFのデバイス選択。
- **視覚**：黒レベル/グロー/ストロボ上限、色域ガード。
- **再現性**：同曲＋同Seedで同じ結果になる（Sculpt/MV）。
- **書き出し**：音ズレ±1フレーム以内、4Kでの失敗率。

---

# 12. 決定事項 v1.1
- **初期プリセット**：Live=3（BEAM/WAVE/PARTICLES）、Sculpt=3、MV=3テンプレで開始。
- **Code Overlay**：既定=Off。ON/OFF（Minimal/Full含む）はUIで切替可能。
- **MV書き出し**：初期は1080p60（WebM）。**アスペクトと縦横の向き選択に対応**。4KはPro限定。
- **対応ブラウザ**：Chrome/Edge/Firefox/Safari を正式サポート目標。PE方針で実装、Tab音声は当面Chrome優先。
- **背景デフォ**：Live=Black、MV=Gradient、Sculpt=Neon。全モードで変更可能。
- **ブランド機能**：Enterpriseにて色域/明度ロックを提供。
- **Tab音声**：初回は優先度低で実装（Chrome系）。
- **データ保持**：Firestore保存件数/容量は初期上限を設け運用で調整（上記6.2参照）。
- **価格帯**：Free/Pro/Enterpriseの3段。金額試算は次フェーズ。

# 13. 付録（将来拡張）
- DMX/Art-Net出力（LANノード経由）
- MIDI/OSCマッピング、外部コントローラ（NanoKONTROL等）
- 歌詞同期（LRC）、タイポグラフィ拡張、OBS/NDIガイド
- 高品質クラウドレンダ（Functions/Cloud Run + FFmpeg）
（将来拡張）
- DMX/Art-Net出力（LANノード経由）
- MIDI/OSCマッピング、外部コントローラ（NanoKONTROL等）
- 歌詞同期（LRC）、タイポグラフィ拡張、OBS/NDIガイド
- 高品質クラウドレンダ（Functions/Cloud Run + FFmpeg）

