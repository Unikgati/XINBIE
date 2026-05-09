/// DapurGizi Core Package
///
/// Shared models, API client, auth, and utilities
/// used by both user_app and driver_app.
library core;

// Models
export 'models/user.dart';
export 'models/product.dart';
export 'models/product_variant.dart';
export 'models/category.dart';
export 'models/order.dart';
export 'models/order_item.dart';
export 'models/address.dart';
export 'models/banner_model.dart';
export 'models/delivery_slot.dart';
export 'models/promo_code.dart';
export 'models/notification_model.dart';
export 'models/driver_profile.dart';
export 'models/driver_wallet.dart';
export 'models/pickup_point.dart';
export 'models/cart_item.dart';
export 'models/region.dart';
export 'models/cooking_video.dart';
export 'models/flash_sale.dart';
export 'models/recipe.dart';


// API
export 'api/api_client.dart';
export 'api/api_providers.dart';
export 'api/api_endpoints.dart';
export 'api/api_exception.dart';
export 'api/socket_service.dart';

// Auth
export 'auth/auth_repository.dart';
export 'auth/auth_state.dart';

// Repositories
export 'repositories/product_repository.dart';
export 'repositories/order_repository.dart';
export 'repositories/address_repository.dart';
export 'repositories/notification_repository.dart';
export 'repositories/driver_repository.dart';
export 'repositories/banner_repository.dart';
export 'repositories/delivery_repository.dart';
export 'repositories/region_repository.dart';
export 'repositories/recipe_repository.dart';

// Utils
export 'utils/currency_formatter.dart';
export 'utils/wa_deeplink.dart';
export 'utils/date_formatter.dart';
export 'utils/validators.dart';
export 'utils/error_handler.dart';

// Constants
export 'constants/enums.dart';
export 'constants/app_config.dart';

// Services
export 'services/notification_service.dart';
export 'services/location_service.dart';
