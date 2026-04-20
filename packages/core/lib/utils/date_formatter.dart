import 'package:intl/intl.dart';

/// Date formatting helpers for Indonesian locale.
class DateFormatter {
  DateFormatter._();

  static final _dateFormat = DateFormat('dd MMM yyyy', 'id_ID');
  static final _dateTimeFormat = DateFormat('dd MMM yyyy · HH:mm', 'id_ID');
  static final _timeFormat = DateFormat('HH:mm', 'id_ID');
  static final _dayFormat = DateFormat('EEEE', 'id_ID');

  static String date(DateTime dt) => _dateFormat.format(dt);
  static String dateTime(DateTime dt) => _dateTimeFormat.format(dt);
  static String time(DateTime dt) => _timeFormat.format(dt);
  static String day(DateTime dt) => _dayFormat.format(dt);

  /// Relative time: "Baru saja", "5 menit lalu", "2 jam lalu", etc.
  static String relative(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'Baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes} menit lalu';
    if (diff.inHours < 24) return '${diff.inHours} jam lalu';
    if (diff.inDays < 7) return '${diff.inDays} hari lalu';
    return date(dt);
  }
}
