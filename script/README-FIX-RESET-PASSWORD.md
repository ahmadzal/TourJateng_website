# FIX RESET PASSWORD ERROR

## Masalah
Error "Database error granting user" saat klik link reset password dari email.

## Penyebab
1. **Email Template Redirect URL salah** di Supabase Dashboard
2. **Trigger database** yang berjalan saat UPDATE password

## Solusi

### LANGKAH 1: Jalankan SQL Fix (SUDAH DILAKUKAN)
Jalankan file `fix-password-reset.sql` di Supabase SQL Editor.

### LANGKAH 2: Update Email Template di Supabase Dashboard

1. Buka **Supabase Dashboard** → Project Settings → Authentication → **Email Templates**

2. Pilih **"Change Email"** atau **"Magic Link"** atau **"Reset Password"** template

3. **GANTI REDIRECT URL** dari:
   ```
   {{ .SiteURL }}/reset-password
   ```
   
   Menjadi:
   ```
   {{ .SiteURL }}/auth/callback?next=/reset-password
   ```

4. Atau gunakan template email yang benar:
   ```html
   <h2>Reset Your Password</h2>
   <p>Follow this link to reset the password for your account:</p>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset Password</a></p>
   ```

### LANGKAH 3: Update Site URL di Supabase

1. Buka **Supabase Dashboard** → Project Settings → **General** → API
2. Pastikan **Site URL** adalah: `http://localhost:3000` (untuk development)
3. Tambahkan **Redirect URLs**: `http://localhost:3000/**`

### LANGKAH 4: Test Ulang

1. Buka halaman `/forgot-password`
2. Masukkan email dan klik kirim
3. Buka email baru (JANGAN pakai link lama)
4. Klik link reset password
5. Masukkan password baru
6. Seharusnya berhasil!

## Catatan Penting

- **Link reset password hanya bisa dipakai 1x**
- **Link expired setelah 1 jam** (default Supabase)
- Jika masih error, **kirim ulang email reset** (jangan pakai link lama)

## Alternative: Bypass Email dengan Magic Link

Jika masih bermasalah, bisa gunakan cara alternatif dengan update password langsung dari profile page setelah login dengan Google OAuth.
