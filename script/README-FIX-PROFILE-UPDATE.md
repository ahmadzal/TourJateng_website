# Fix Update Profile Error untuk User OAuth Google

## Masalah
User yang login menggunakan Google OAuth tidak bisa memperbarui profil mereka. Error yang muncul: `Error updating profile: {}`

## Penyebab
1. Query UPDATE mencoba mengupdate field yang tidak seharusnya (seperti `updated_at` yang auto-managed oleh trigger)
2. RLS (Row Level Security) policy yang tidak tepat
3. Kurangnya validasi dan error handling yang jelas
4. Field `gender` dan `no_telepon` mungkin belum ada di database

## Solusi

### 1. Jalankan SQL Script untuk Fix Database
Jalankan file `fix-user-update-oauth.sql` di Supabase SQL Editor:

```bash
# File tersebut akan:
# - Menambahkan kolom gender dan no_telepon jika belum ada
# - Memperbaiki RLS policies
# - Memperbaiki trigger untuk auto-update updated_at
```

### 2. Update Code Sudah Dilakukan
Kode di `app/profile/edit/page.tsx` sudah diperbaiki dengan:
- Menghapus field `updated_at` dari query update (biar auto-update via trigger)
- Menambahkan validasi input
- Menambahkan logging yang lebih detail untuk debugging
- Menambahkan `.select()` untuk melihat hasil update
- Memperbaiki error handling dengan pesan yang lebih jelas

### 3. Cara Testing
1. Login menggunakan akun Google
2. Buka halaman edit profil (`/profile/edit`)
3. Ubah data profil (nama, no telepon, atau gender)
4. Klik tombol "Simpan"
5. Periksa console browser (F12) untuk melihat log detail jika masih ada error

### 4. Debug Jika Masih Error
Jika masih ada error, periksa:

1. **Console Browser (F12 -> Console)**
   - Lihat log: `Updating profile with data:` - pastikan data yang dikirim benar
   - Lihat log: `Update response:` - cek error detail dari Supabase

2. **Supabase Dashboard**
   - Buka Table Editor -> users
   - Pastikan kolom `gender` dan `no_telepon` sudah ada
   - Periksa RLS policies di Table Settings

3. **Test Manual di Supabase SQL Editor**
   ```sql
   -- Test update manual dengan user ID Anda
   UPDATE public.users 
   SET 
     full_name = 'Test Name',
     gender = 'Laki-Laki',
     no_telepon = '08123456789'
   WHERE id = 'YOUR_USER_ID';
   
   -- Lihat hasilnya
   SELECT * FROM public.users WHERE id = 'YOUR_USER_ID';
   ```

### 5. Common Issues

#### Issue: "new row violates row-level security policy"
**Solution:** RLS policy tidak memperbolehkan user update. Jalankan SQL:
```sql
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

#### Issue: "column does not exist"
**Solution:** Kolom belum ada di database. Jalankan:
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS no_telepon TEXT;
```

#### Issue: Error kosong `{}`
**Solution:** Ini biasanya RLS atau permission issue. Check:
- Apakah user sudah authenticated?
- Apakah RLS policy sudah benar?
- Apakah user ID di query sama dengan auth.uid()?

## Perubahan yang Dilakukan

### File: `app/profile/edit/page.tsx`
1. Menambahkan validasi input
2. Menghapus `updated_at` dari query update
3. Menambahkan conditional update untuk field optional
4. Menambahkan console.log untuk debugging
5. Menambahkan `.select()` untuk melihat hasil update
6. Memperbaiki error message handling

### File: `fix-user-update-oauth.sql` (Baru)
Script SQL untuk fix database structure dan policies.

## Testing Checklist
- [ ] User bisa login dengan Google
- [ ] Halaman edit profil terbuka tanpa error
- [ ] Form terisi dengan data user yang sudah ada
- [ ] Bisa update nama depan dan belakang
- [ ] Bisa update no telepon
- [ ] Bisa pilih gender
- [ ] Bisa upload foto profil
- [ ] Data tersimpan dan terlihat di halaman profil
- [ ] Navbar terupdate dengan nama baru
- [ ] Tidak ada error di console

## Notes
- Email tidak bisa diubah (disabled field) karena tied to OAuth
- ID juga tidak bisa diubah (read-only)
- `updated_at` auto-update via database trigger
- Photo upload menggunakan Supabase Storage bucket 'avatars'
