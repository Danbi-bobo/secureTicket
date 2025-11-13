# Hướng dẫn Deploy SecureTicket lên Production

## Tổng quan

Project này là một React app với Vite, sử dụng Supabase làm backend. Vì đã chuyển sang dùng Supabase client trực tiếp (không cần API server), bạn có thể deploy đơn giản chỉ cần frontend.

## Các bước chuẩn bị

### 1. Chuẩn bị Environment Variables

Tạo file `.env.production` hoặc set các biến môi trường trên platform deploy:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Lưu ý:** Trong Vite, tất cả biến môi trường phải có prefix `VITE_` để được expose ra client-side.

### 2. Build project

```bash
npm run build
```

Sau khi build, thư mục `dist/` sẽ chứa các file static cần deploy.

---

## Option 1: Deploy lên Vercel (Khuyến nghị - Miễn phí)

Vercel là platform tốt nhất cho React/Vite apps, miễn phí và dễ sử dụng.

### Các bước:

1. **Cài đặt Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login vào Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Hoặc deploy production:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables:**
   - Vào Vercel Dashboard → Project Settings → Environment Variables
   - Thêm:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **Tự động deploy từ GitHub:**
   - Push code lên GitHub
   - Kết nối repo với Vercel
   - Vercel sẽ tự động deploy mỗi khi push

### File cấu hình Vercel (tùy chọn):

Tạo file `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## Option 2: Deploy lên Netlify (Miễn phí)

### Các bước:

1. **Cài đặt Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

4. **Hoặc qua Netlify Dashboard:**
   - Đăng ký tại https://netlify.com
   - Kéo thả thư mục `dist/` vào Netlify
   - Set environment variables trong Site settings

### File cấu hình Netlify:

Tạo file `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Option 3: Deploy lên GitHub Pages (Miễn phí)

### Các bước:

1. **Cài đặt gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Thêm script vào package.json:**
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Cập nhật vite.config.ts:**
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/', // Thay bằng tên repo của bạn
     // ... rest of config
   })
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

---

## Option 4: Deploy lên Railway/Render (Nếu cần backend)

Nếu bạn muốn giữ server.ts cho tương lai, có thể deploy backend lên:

### Railway:
1. Đăng ký tại https://railway.app
2. Tạo project mới
3. Connect GitHub repo
4. Set environment variables
5. Railway sẽ tự động detect và deploy

### Render:
1. Đăng ký tại https://render.com
2. Tạo Web Service
3. Connect GitHub repo
4. Build command: `npm install && npm run build`
5. Start command: `npm run server` (nếu cần)

---

## Cấu hình Supabase cho Production

### 1. Cập nhật RLS Policies

Đảm bảo Row Level Security policies cho phép:
- Users đọc tickets/messages trong projects họ tham gia
- Users tạo messages cho tickets họ có quyền
- Users tạo audit logs

### 2. CORS Settings

Trong Supabase Dashboard → Settings → API:
- Thêm domain của bạn vào "Allowed CORS origins"
- Ví dụ: `https://your-app.vercel.app`

### 3. Environment Variables

**Development (.env.local):**
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (chỉ dùng cho server.ts nếu cần)
```

**Production (trên Vercel/Netlify):**
- Chỉ cần `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
- Không cần `SUPABASE_SERVICE_ROLE_KEY` vì không dùng API server

---

## Checklist trước khi deploy

- [ ] Build thành công: `npm run build`
- [ ] Test local với `npm run preview`
- [ ] Set đúng environment variables
- [ ] Cập nhật CORS trong Supabase
- [ ] Kiểm tra RLS policies
- [ ] Test authentication flow
- [ ] Test tạo ticket, message, etc.

---

## Troubleshooting

### Lỗi CORS:
- Thêm domain vào Supabase CORS settings
- Kiểm tra `VITE_SUPABASE_URL` có đúng không

### Lỗi Authentication:
- Kiểm tra `VITE_SUPABASE_ANON_KEY`
- Kiểm tra Supabase Auth settings

### Lỗi RLS:
- Kiểm tra policies trong Supabase
- Đảm bảo user có quyền truy cập

---

## Lưu ý quan trọng

1. **Không commit `.env.local`** - File này chứa secrets
2. **Chỉ expose `VITE_*` variables** - Các biến khác sẽ không hoạt động
3. **Service Role Key** - Chỉ dùng trên server, không bao giờ expose ra client
4. **Supabase RLS** - Đảm bảo policies đúng để bảo mật data

---

## Quick Start với Vercel (Khuyến nghị)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Set env vars trong Vercel Dashboard
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

Sau khi deploy, bạn sẽ có URL như: `https://your-app.vercel.app`

