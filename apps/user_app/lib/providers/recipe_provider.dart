import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

final recipesProvider = FutureProvider.autoDispose.family<List<Recipe>, Map<String, int>>((ref, params) async {
  final repository = ref.watch(recipeRepositoryProvider);
  return repository.getRecipes(
    page: params['page'] ?? 1,
    limit: params['limit'] ?? 10,
  );
});

final recipeDetailProvider = FutureProvider.autoDispose.family<Recipe, String>((ref, idOrSlug) async {
  final repository = ref.watch(recipeRepositoryProvider);
  return repository.getRecipe(idOrSlug);
});

class RecipesNotifier extends StateNotifier<AsyncValue<List<Recipe>>> {
  RecipesNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadRecipes();
  }

  final RecipeRepository _repository;
  int _page = 1;
  bool _hasMore = true;
  final List<Recipe> _recipes = [];

  bool get hasMore => _hasMore;

  Future<void> loadRecipes() async {
    if (!_hasMore) return;

    try {
      if (_page == 1) state = const AsyncValue.loading();

      final newRecipes = await _repository.getRecipes(page: _page, limit: 10);
      
      if (newRecipes.isEmpty) {
        _hasMore = false;
      } else {
        _recipes.addAll(newRecipes);
        _page++;
      }

      state = AsyncValue.data(List.from(_recipes));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() async {
    _page = 1;
    _hasMore = true;
    _recipes.clear();
    await loadRecipes();
  }
}

final paginatedRecipesProvider =
    StateNotifierProvider.autoDispose<RecipesNotifier, AsyncValue<List<Recipe>>>((ref) {
  return RecipesNotifier(ref.watch(recipeRepositoryProvider));
});
