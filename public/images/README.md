# `/public/images/` — 정적 이미지 자산

Next.js의 `public/` 하위 파일은 빌드 후 **`/images/파일명`** 경로로 즉시 접근됩니다.

```
frontend/public/images/hero.jpg
                ↓
브라우저:        https://elfbarlounge.co.kr/images/hero.jpg
                또는 http://localhost:3030/images/hero.jpg
```

## Figma → 코드 교체 흐름

1. 디자이너가 **Figma 데스크톱** 우측 Inspect 패널 → **Export** 클릭 → PNG/JPG 다운로드
2. 받은 파일을 이 폴더(`frontend/public/images/`)에 **아래 파일명 규칙에 맞춰** 저장
3. 개발자에게 "이미지 넣었어요" 알리면 → `page.tsx` 등의 URL을 `/images/파일명` 으로 교체

## 파일명 매핑 (현재 코드에서 사용 자리)

### 메인 페이지 (`frontend/src/app/page.tsx`)
| 자리 | 권장 파일명 | 권장 크기 | 현재 (임시) |
|---|---|---|---|
| Hero 우측 제품 이미지 | `hero-product.png` | 800×800 (투명 PNG 권장) | Unsplash |
| Hero 배너 (DB banner) | DB `banners.image_url` 필드 | 1920×500 | Unsplash (시드) |
| DUKE 풀폭 배너 | `duke-banner.jpg` | 1600×600 | Unsplash |
| 인기 액상 좌측 (분홍 톤) | `liquid-popular.jpg` | 800×400 | Unsplash |
| 인기 액상 우측 (보라 톤) | `liquid-new.jpg` | 800×400 | Unsplash |
| 시리즈 ICE COOL | `series-ice-cool.jpg` | 800×500 | Unsplash |
| 시리즈 SHIMMERING | `series-shimmering.jpg` | 800×500 | Unsplash |
| 인스타그램 피드 8장 | `ig-1.jpg` ~ `ig-8.jpg` | 400×400 정사각 | Unsplash |

### 카테고리 아이콘 (`page.tsx`의 `CATEGORY_VISUAL`)
| 카테고리 | 권장 파일명 | 권장 크기 | 현재 |
|---|---|---|---|
| 베스트 | `cat-best.png` | 80×80 (투명 PNG) | 이모지 🔥 |
| 신상품 | `cat-new.png` | 80×80 | ✨ |
| 일회용 | `cat-disposable.png` | 80×80 | 💨 |
| 액상 | `cat-liquid.png` | 80×80 | 💧 |
| 기기 | `cat-devices.png` | 80×80 | 🔋 |
| 악세서리 | `cat-accessory.png` | 80×80 | 🎀 |

### 엘프바 선택 이유 8칸 (`page.tsx`의 `REASONS`)
| 이유 | 권장 파일명 |
|---|---|
| 정품 인증 | `reason-genuine.png` |
| 빠른 배송 | `reason-fast.png` |
| 안전 결제 | `reason-secure.png` |
| 1:1 CS | `reason-cs.png` |
| 적립금 혜택 | `reason-points.png` |
| 성인 인증 | `reason-adult.png` |
| 교환·반품 | `reason-refund.png` |
| 안전 포장 | `reason-pack.png` |

### 어드민 등록 영역 (코드 수정 불필요)
다음은 어드민 화면에서 URL 입력만으로 갱신:
- 메인 배너 (`/admin/content` → 배너 탭)
- 이벤트 배너 (`/admin/content` → 이벤트 탭)
- 상품 썸네일·상세 이미지 (`/admin/products`)

→ Figma export 파일을 이 폴더에 두고 어드민에 `/images/banner-summer.jpg` 같은 경로 입력하면 즉시 반영.

## 파일 포맷 권장

| 용도 | 포맷 | 비고 |
|---|---|---|
| 풍경·인물·제품 사진 | JPG (q=85) | 용량 작음 |
| 투명 배경 필요 (제품 누끼·아이콘) | PNG | 알파 채널 |
| 단색·도형·로고 | SVG | 무한 확대, Next/Image 안 거치고 직접 `<img>` |
| 큰 배너 (성능 중요) | WebP | 다음 단계 최적화 |

## 다음 단계 (자산 도착 시 개발자 처리)

```bash
# 1. 코드의 Unsplash URL을 /images/ 로 교체
grep -rn "images.unsplash.com" frontend/src/app/page.tsx
# 2. 수동 또는 sed 로 일괄 치환
# 3. next.config.ts 의 remotePatterns 에서 unsplash 제거 (운영 전)
# 4. npm run build 확인
```
