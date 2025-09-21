# ゴール
「音量や帯域をそのまま毎フレーム当てる」方式をやめ、**音の“出来事（イベント）”が積もって絵になる**アート表現に刷新する。キックやハイハット等の**瞬間**が、時間とともに**構造を育てる**。UIは現行を流用。

---

# 要件（アート指向）
- **Event-Driven**：連続値（RMS/Low/Mid/High）に加え、Onset/Pitch等の**離散イベント**を中心に駆動。
- **Accumulation**：イベントが**痕跡／ノード／ストローク**として蓄積し、1曲で“作品”が立ち上がる。
- **Memory**：静かな場面でも**記憶（半減期）**で余韻が残る。唐突に消えない。
- **Palette & Light**：色は限定（2–3色の主役＋補助）、**黒点維持・グロー層分離**、ガンマ2.2。
- **可搬性**：1080p/60fps目標、Safari/Firefox対応（PE方針）。

---

# モジュール分割
## 1) AudioAnalysis
- 入出力
```ts
interface AnalysisFrame {
  time: number;
  rms: number; low: number; mid: number; high: number;
  centroid: number; // スペクトル重心 [0..1]
  pitch?: number; // MIDIノート or null
  chroma?: number[]; // 12次元正規化 or undefined
  onsets: { band: 'low'|'mid'|'high'|'full'; energy: number }[];
}
```
- 実装要点
  - FFT 1024/2048、スペクトルフラックス＋適応閾値で**onsets**抽出（band別）。
  - **BPM推定**は簡易、**拍位相**（0..1）を出す。
  - **整形**：Attack/Decay, smoothing, hard gate, quantize(1/8,1/16, swing)。

## 2) EventBus / EventQueue
```ts
type AudioEvent = {
  t: number; // 発生時刻
  band: 'low'|'mid'|'high'|'full';
  energy: number; // 0..1
  pitch?: number; centroid?: number;
};

class EventQueue {
  push(e: AudioEvent): void;
  popSince(t0:number, t1:number): AudioEvent[]; // フレーム間イベント取得
}
```
- 同時多発は**クラスタ**（±30ms）で1つにまとめ、energyは合成。
- **Half-life**（例：0.8–2.0s）設定で“記憶”の減衰を提供。

## 3) ModMatrix（ソース→ターゲット）
```ts
// Source（rms/low/mid/high/centroid/pitch/phase/onsetX）
// Transform（env/curve/range/gate/jitter/quantize）
// Target（motion/shape/color/fx/material/mask）
interface Route { source: string; target: string; amount: number; curve?: 'lin'|'exp'|'log'|'step'; gate?: number; jitter?: number; }
```
- Matrix UIは既存仕様に準拠。**量/カーブ/ゲート**が効くこと。

## 4) Renderers（3つから開始）
### A. StrokeWeave（粒子ストローク堆積）
- **発火**：イベントごとに**Stroke**を生成（方向＝pitch/chroma、長さ＝energy、始点半径＝centroid）。
- **経路**：スクリーン空間の**Flow Field**（curl-noise）に沿って筆致を描く。
- **描画**：WebGL2 instancing。各Strokeは**帯形クワッド**（頂点シェーダで太さ制御）。
- **蓄積**：FBO ping-pongで**persistent trails**＋**decay**（半減期）。
- **グロー**：別FBOに輝度成分を抽出→ブラー→加算。

### B. BioCircuit（枝×回路グラフ成長）
- **発火**：イベント→**Attractor**（スクリーン座標）を配置（角度＝pitch、半径＝centroid）。
- **成長**：1拍ごとに**Space Colonization**で枝を延伸（近傍Attractorを消化）。
- **表示**：枝＝**スクリーンスペース細線**、節点＝**ノードグロー**。High onsetで**スパーク**。

### C. CrystalLoom（SDF堆積×裂け目）
- **場**：SDF（メタボール＋プリズム）。イベントで**ボリューム寄与**を追加。
- **表面**：閾値抽出→**リム光(Fresnel)** と**薄膜色**。High onsetで**クラック**に閃光。

---

# 技術要点
- **Ping-Pong FBO**（history / current / glow）。
- **Tonemapping**：Filmic/ACES近似、**gamma=2.2**。
- **Palette**：Neon/Warm/Corporate/Mono（2色補間＋微ノイズ）。
- **Fail-safe**：FPS<50で strokeCount/branchStep を段階的に下げる。
- **Safari**：OffscreenCanvas不可時は通常Canvasへ、ブラーサイズ制限。

---

# 受け入れ基準
1. 無音時に消滅せず、**半減期**で余韻が残る（記憶）。
2. 1分再生すると、**明らかに複雑な構造**が形成される（スクショ比較で差分 > 60%）。
3. キック/ハイハット等をミュートすると、該当要素（太さ/スパーク等）が**目に見えて変化**。
4. Palette切替で安っぽくならず、**黒レベル**が保持される（照明用途OK）。
5. 1080pで60fps（最低30fps）、GCフリーズなし。

---

# 実装タスク（Cursor）
**Task 1：AudioAnalysis + EventQueue**
- フレーム毎に`AnalysisFrame`生成、onsets抽出、`EventQueue`へpush。
- `halfLife`と`quantizeGrid`（1/8, swing）を設定可能に。

**Task 2：Renderer A: StrokeWeave**
- instancingで最大10k strokes、**flow field**で曲線生成。
- FBO feedbackで**trail decay**。glowは別パス。

**Task 3：Renderer B: BioCircuit**
- Attractor生成→Space Colonizationで枝成長。節点グロー、High onsetでスパーク。

**Task 4：ModMatrix統合**
- 低域→太さ、mid→曲率、high→スパーク、rms→露光 を初期マップに。
- UIに**Route追加/削除**、量/カーブ/ゲート編集。

**Task 5：美学調整**
- ACES近似トーンマップ、ガンマ2.2、黒クリップ（0.0–0.01）。
- パレット4種＋**微ノイズ**（dither）でバンディング回避。

---

# 参考擬似コード（概念のみ・実装は任意）
```ts
// 毎フレーム
const f:AnalysisFrame = analyser.next();
const events = queue.popSince(prevT, nowT);
// Memory integrator
memory = mix(memory, 0, dt/halfLife);
for (const e of events) {
  spawnStroke(e); // or addAttractor(e)
  memory += e.energy * bandWeight(e.band);
}
// Renderer
strokeWeave.update(dt, memory, routes);
strokeWeave.draw(fboHistory, fboGlow);
```

---

# 注意（避けるべきダサさ）
- 帯域→スケール直結だけの単調反応
- 彩度max/虹色グラデの常用（**色は抑制の美学**）
- 毎拍フル白フラッシュ多用（安全性と疲労）
- 輪郭のギザギザ（**ガンマ誤り／線幅量子化不足**）

---

# テスト曲パック（開発用）
- Kick強め、Hi-hat多め、アンビエント3種（SUNO出力でもOK）。
- それぞれで**1分間の成長**をgif/動画で確認。

