# Google OAuth Setup Guide

## Fitur yang Diimplementasikan

Aplikasi TourJateng sekarang mendukung login/register menggunakan akun Google. Ketika pengguna menekan tombol "Google":

1. **Jika akun Google sudah terdaftar**: Pengguna langsung login dan diarahkan ke halaman utama
2. **Jika akun Google belum terdaftar**: Sistem otomatis membuat akun baru menggunakan data dari Google (nama dan email), lalu mengarahkan ke halaman utama

## File yang Dimodifikasi/Dibuat

### 1. `lib/supabase.ts`
- Ditambahkan fungsi `signInWithGoogle()` untuk menangani OAuth flow dengan Google
- Fungsi ini menggunakan `supabase.auth.signInWithOAuth()` dengan provider Google

### 2. `app/register/page.tsx`
- Ditambahkan state `googleLoading` untuk menampilkan loading saat proses OAuth
- Ditambahkan fungsi `handleGoogleSignIn()` untuk menangani klik tombol Google
- Ditambahkan `useEffect` untuk menangani error dari OAuth callback
- Tombol Google sekarang fungsional dengan onClick handler dan loading state

### 3. `app/login/page.tsx`
- Diperbarui fungsi `handleGoogleLogin()` untuk menggunakan fungsi `signInWithGoogle()` dari supabase.ts
- Konsistensi dengan implementasi di halaman register

### 4. `app/auth/callback/route.ts` (BARU)
- Route handler untuk menangani redirect dari Google OAuth
- Menukar authorization code dengan session
- Membuat profil user di database jika belum ada
- Redirect ke halaman utama setelah berhasil

## Setup Konfigurasi Supabase

Untuk mengaktifkan Google OAuth, Anda perlu mengkonfigurasi di Supabase Dashboard:

### Langkah 1: Buat Google OAuth Credentials

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Pergi ke **APIs & Services > Credentials**
4. Klik **Create Credentials > OAuth 2.0 Client IDs**
5. Pilih **Web application**
6. Tambahkan **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-domain.com
   ```
7. Tambahkan **Authorized redirect URIs**:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
8. Simpan **Client ID** dan **Client Secret**

### Langkah 2: Konfigurasi di Supabase

1. Buka Supabase Dashboard
2. Pergi ke **Authentication > Providers**
3. Aktifkan **Google**
4. Masukkan **Client ID** dan **Client Secret** dari Google
5. Klik **Save**

### Langkah 3: Setup Redirect URL

Di Supabase Dashboard, pastikan URL berikut ditambahkan di **Authentication > URL Configuration**:

- **Site URL**: `http://localhost:3000` (development) atau `https://your-domain.com` (production)
- **Redirect URLs**: 
  ```
  http://localhost:3000/auth/callback
  https://your-domain.com/auth/callback
  ```

## Cara Kerja Flow

### Register dengan Google

1. User mengklik tombol "Google" di halaman `/register`
2. Sistem memanggil `signInWithGoogle()` yang membuat OAuth request ke Google
3. User diarahkan ke halaman login Google
4. Setelah user memberikan izin, Google mengirim authorization code ke `/auth/callback`
5. Route handler menukar code dengan session
6. Jika user baru, sistem membuat profil di tabel `users`
7. User diarahkan ke halaman utama (sudah dalam keadaan login)

### Login dengan Google

1. User mengklik tombol "Google" di halaman `/login`
2. Flow sama dengan register
3. Jika user sudah punya akun, langsung login tanpa membuat profil baru
4. User diarahkan ke halaman utama

## Struktur Database

User yang login dengan Google akan memiliki data di tabel `users`:

```sql
{
  id: "uuid-from-google",
  email: "user@gmail.com",
  full_name: "User Full Name", -- dari Google user_metadata
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

## Testing

### Development (localhost)
```bash
npm run dev
```

Buka `http://localhost:3000/register` atau `http://localhost:3000/login` dan klik tombol Google.

### Production
Pastikan semua URL di Google Cloud Console dan Supabase Dashboard sudah diupdate dengan domain production Anda.

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Pastikan redirect URI di Google Cloud Console sesuai dengan format Supabase
- Format: `https://your-project-id.supabase.co/auth/v1/callback`

### Error: "invalid_client"
- Pastikan Client ID dan Client Secret di Supabase Dashboard benar
- Coba regenerate credentials di Google Cloud Console

### User tidak ter-redirect setelah login
- Cek console browser untuk error
- Pastikan route `/auth/callback` berfungsi dengan baik
- Cek Supabase logs untuk melihat error detail

### Profile tidak terbuat di database
- Pastikan tabel `users` sudah ada dengan kolom yang sesuai
- Cek error di console route `/auth/callback`
- Pastikan RLS (Row Level Security) policies mengizinkan insert

## Security Notes

1. **Client Secret**: Jangan pernah commit Client Secret ke repository
2. **Environment Variables**: Gunakan `.env.local` untuk menyimpan credentials
3. **HTTPS**: Selalu gunakan HTTPS di production
4. **RLS Policies**: Pastikan Row Level Security policies sudah dikonfigurasi dengan benar di Supabase

## Fitur Tambahan (Opsional)

Untuk meningkatkan experience pengguna, pertimbangkan untuk menambahkan:

1. **Email Verification**: Walaupun Google sudah verified, Anda bisa menambahkan step tambahan
2. **Profile Completion**: Redirect ke halaman profile untuk melengkapi data tambahan
3. **Terms of Service**: Tampilkan ToS saat first-time login dengan Google
4. **Link Account**: Izinkan user untuk link akun Google dengan akun email/password yang sudah ada

## Support

Untuk pertanyaan atau issue, silakan check:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
