/// DapurGizi Core Package
///
/// Shared models, API client, auth, and utilities
/// used by both user_app and driver_app.
library core;

// Models
export 'models/user.dart';
export 'models/product.dart';
export 'models/category.dart';
export 'models/order.dart';
export 'models/order_item.dart';
export 'models/address.dart';
export 'models/banner_model.dart';
export 'models/delivery_slot.dart';
export 'models/promo_code.dart';
export 'models/notification_model.dart';
export 'models/driver_profile.dart';
export 'models/pickup_point.dart';
export 'models/product_variant.dart';
export 'models/cart_item.dart';

// API
export 'api/api_client.dart';
export 'api/api_endpoints.dart';
export 'api/api_exception.dart';

// Auth
export 'auth/auth_repository.dart';
export 'auth/auth_state.dart';

// Utils
export 'utils/currency_formatter.dart';
export 'utils/wa_deeplink.dart';
export 'utils/date_formatter.dart';
export 'utils/validators.dart';

// Constants
export 'constants/enums.dart';
export 'constants/app_config.dart';
