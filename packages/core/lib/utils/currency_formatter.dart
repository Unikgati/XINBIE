import 'package:intl/intl.dart';

/// Format Indonesian Rupiah currency.
class CurrencyFormatter {
  CurrencyFormatter._();

  static final _formatter = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  /// Format integer to "Rp 12.000"
  static String format(int amount) => _formatter.format(amount);

  /// Short format: "12rb" for amounts >= 1000
  static String formatShort(int amount) {
    if (amount >= 1000000) {
      return 'Rp ${(amount / 1000000).toStringAsFixed(1)}jt';
    }
    if (amount >= 1000) {
      return 'Rp ${(amount / 1000).toStringAsFixed(0)}rb';
    }
    return format(amount);
  }
}
