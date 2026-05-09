import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_providers.dart';
import '../api/api_providers.dart';
import '../api/api_endpoints.dart';
import '../models/recipe.dart';

class RecipeRepository {
  RecipeRepository(this._api);

  final ApiClient _api;

  Future<List<Recipe>> getRecipes({int page = 1, int limit = 10}) async {
    final response = await _api.get(ApiEndpoints.recipes, queryParameters: {
      'page': page,
      'limit': limit,
    });
    final data = response.data as Map<String, dynamic>;
    final list = data['data'] as List;
    return list.map((e) => Recipe.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Recipe> getRecipe(String idOrSlug) async {
    final response = await _api.get(ApiEndpoints.recipe(idOrSlug));
    return Recipe.fromJson(response.data as Map<String, dynamic>);
  }
}

final recipeRepositoryProvider = Provider<RecipeRepository>((ref) {
  return RecipeRepository(ref.watch(apiClientProvider));
});
