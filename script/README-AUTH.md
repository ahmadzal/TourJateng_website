# Setup Autentikasi Supabase untuk TourJateng

## 1. Setup Supabase Project

### Langkah 1: Buat Project Supabase
1. Kunjungi [supabase.com](https://supabase.com)
2. Buat akun atau login
3. Klik "New Project"
4. Pilih organisasi dan masukkan detail project
5. Tunggu project selesai dibuat

### Langkah 2: Setup Database
1. Buka SQL Editor di dashboard Supabase
2. Copy dan jalankan script dari file `supabase-setup.sql`
3. Script akan membuat:
   - Tabel `users` untuk menyimpan data user
   - Function `handle_new_user()` untuk auto-create profile
   - Trigger `on_auth_user_created` untuk otomatis menjalankan function
   - RLS (Row Level Security) policies
   - Helper functions untuk get dan update profile

### Langkah 3: Konfigurasi Environment Variables
1. Copy file `.env.example` menjadi `.env.local`
2. Isi dengan data dari Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Cara mendapatkan keys:**
- SUPABASE_URL: Dashboard > Settings > API
- ANON_KEY: Dashboard > Settings > API (public anon key)
- SERVICE_ROLE_KEY: Dashboard > Settings > API (service_role key)

### Langkah 4: Konfigurasi Authentication
1. Buka Authentication > Settings di dashboard
2. Setup Email templates (opsional)
3. Konfigurasi redirect URLs jika diperlukan

## 2. Cara Kerja Sistem

### Flow Registration:
1. User mengisi form register
2. Function `signUp()` dipanggil dengan email, password, dan full_name
3. Supabase Auth membuat user baru
4. Trigger `on_auth_user_created` otomatis dijalankan
4. Function `handle_new_user()` membuat record di tabel `users`
5. User diarahkan ke halaman konfirmasi

### Flow Login:
1. User mengisi form login
2. Function `signIn()` dipanggil dengan email dan password
3. Supabase Auth memverifikasi kredensial
4. AuthProvider mengupdate state aplikasi
5. User diarahkan ke dashboard/homepage

### Auto-Save ke Database:
Ketika user registrasi, data otomatis tersimpan ke tabel `users` dengan struktur:
```sql
- id (UUID) - Foreign key ke auth.users
- email (TEXT) - Email user
- full_name (TEXT) - Nama lengkap dari form registration
- avatar_url (TEXT) - URL avatar (default null)
- created_at (TIMESTAMP) - Waktu dibuat
- updated_at (TIMESTAMP) - Waktu diupdate
```

## 3. Struktur File yang Dibuat/Diupdate

```
├── app/
│   ├── register/page.tsx          # Form registrasi dengan Supabase
│   ├── login/page.tsx             # Form login dengan Supabase
│   ├── layout.tsx                 # Root layout dengan AuthProvider
│   └── api/
│       └── profile/
│           └── route.ts           # API endpoint untuk profile
├── lib/
│   ├── supabase.ts               # Konfigurasi dan helper functions
│   └── auth-context.tsx          # React Context untuk auth state
├── supabase-setup.sql            # Script SQL untuk setup database
├── .env.example                  # Template environment variables
└── README-AUTH.md               # Dokumentasi ini
```

## 4. Testing

### Test Registration:
1. Jalankan development server: `npm run dev`
4. Buka `/register`
5. Isi form dengan data valid
6. Submit form
7. Cek di Supabase Dashboard > Authentication > Users
8. Cek di Supabase Dashboard > Table Editor > users

### Test Login:
1. Buka `/login`
2. Masukkan email dan password dari user yang sudah terdaftar
3. Submit form
4. User harus berhasil login dan diarahkan ke homepage

### Verifikasi Database:
```sql
-- Cek user di tabel auth
SELECT * FROM auth.users;

-- Cek profile yang tersimpan otomatis
SELECT * FROM public.users;

-- Cek trigger dan function
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

## 5. Security Features

- **Row Level Security (RLS)**: User hanya bisa akses data mereka sendiri
- **Email Verification**: Supabase mengirim email konfirmasi (opsional)
- **Password Validation**: Minimum 6 karakter
- **JWT Tokens**: Otomatis dikelola oleh Supabase
- **HTTPS**: Semua komunikasi terenkripsi

## 6. Troubleshooting

### Error: "Missing Supabase environment variables"
- Pastikan file `.env.local` ada dan berisi variabel yang benar
- Restart development server setelah menambah environment variables

### Error: "User already registered"
- Email sudah terdaftar di Supabase
- Gunakan email lain atau reset password

### User profile tidak tersimpan otomatis:
- Pastikan trigger `on_auth_user_created` sudah dibuat
- Cek function `handle_new_user()` sudah ada
- Lihat logs error di Supabase Dashboard > Logs

### RLS Policy Error:
- Pastikan policies sudah dibuat dengan benar
- Cek apakah user sudah authenticated
- Verifikasi policy conditions

## 7. Development Tips

- Gunakan `useAuth()` hook untuk mendapatkan user state
- Profile data otomatis sync dengan auth state
- Gunakan `refreshProfile()` setelah update data user
- Error handling sudah built-in di semua function

## 8. Production Deployment

1. Setup environment variables di platform deployment
2. Pastikan CORS settings benar di Supabase
3. Update redirect URLs untuk production domain
4. Enable SSL/HTTPS untuk keamanan
5. Monitor logs untuk troubleshooting