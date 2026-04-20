/// WhatsApp deep link builder per PRD Appendix B.
class WaDeeplink {
  WaDeeplink._();

  /// Build WhatsApp deep link.
  /// [phone] in format 628xxxxxxxxxx (no +)
  static String build(String phone, {String? message}) {
    final encoded = message != null ? Uri.encodeComponent(message) : '';
    return 'https://wa.me/$phone${encoded.isNotEmpty ? '?text=$encoded' : ''}';
  }

  /// Deep link for driver to contact recipient.
  static String driverToRecipient({
    required String phone,
    required String recipientName,
    required String orderCode,
  }) {
    return build(phone,
        message:
            'Halo $recipientName, saya driver Dapur Gizi yang akan mengantar pesanan #$orderCode Anda.');
  }

  /// Deep link for user to contact driver.
  static String userToDriver({
    required String phone,
    required String orderCode,
  }) {
    return build(phone,
        message: 'Halo, saya penerima pesanan #$orderCode');
  }

  /// Deep link to contact admin.
  static String toAdmin(String adminPhone) {
    return build(adminPhone, message: 'Halo Admin Dapur Gizi, saya butuh bantuan.');
  }

  /// Normalize phone input (08xx or +628xx) to 628xxxxxxxxxx.
  static String normalizePhone(String input) {
    var cleaned = input.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
    if (cleaned.startsWith('0')) cleaned = '62${cleaned.substring(1)}';
    return cleaned;
  }
}
