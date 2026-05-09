import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

/// Global provider for ApiClient.
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});
