/// Input validators for forms.
class Validators {
  Validators._();

  static String? email(String? value) {
    if (value == null || value.isEmpty) return 'Email wajib diisi';
    final regex = RegExp(r'^[\w\.-]+@[\w\.-]+\.\w{2,}$');
    if (!regex.hasMatch(value)) return 'Format email tidak valid';
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Password wajib diisi';
    if (value.length < 8) return 'Minimal 8 karakter';
    if (!RegExp(r'[A-Z]').hasMatch(value)) return 'Harus ada 1 huruf besar';
    if (!RegExp(r'[0-9]').hasMatch(value)) return 'Harus ada 1 angka';
    return null;
  }

  static String? confirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) return 'Konfirmasi password wajib diisi';
    if (value != password) return 'Password tidak cocok';
    return null;
  }

  static String? required(String? value, [String field = 'Field']) {
    if (value == null || value.trim().isEmpty) return '$field wajib diisi';
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.isEmpty) return 'Nomor WhatsApp wajib diisi';
    final cleaned = value.replaceAll(RegExp(r'[\s\-\(\)\+]'), '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      return 'Nomor tidak valid';
    }
    return null;
  }

  static String? name(String? value) {
    if (value == null || value.trim().isEmpty) return 'Nama wajib diisi';
    if (value.trim().length < 2) return 'Nama terlalu pendek';
    return null;
  }

  /// Password strength: 0-4 (weak, fair, good, strong, very strong).
  static int passwordStrength(String password) {
    int score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (RegExp(r'[A-Z]').hasMatch(password)) score++;
    if (RegExp(r'[0-9]').hasMatch(password)) score++;
    if (RegExp(r'[!@#\$%\^&\*\(\)_\+\-=\[\]{};:,\.<>?]').hasMatch(password)) {
      score++;
    }
    return score.clamp(0, 4);
  }
}
