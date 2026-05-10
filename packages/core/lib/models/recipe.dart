import 'package:freezed_annotation/freezed_annotation.dart';
import 'product.dart';

part 'recipe.freezed.dart';
part 'recipe.g.dart';

@freezed
abstract class Recipe with _$Recipe {
  const factory Recipe({
    required String id,
    required String title,
    required String slug,
    String? heroImage,
    @Default([]) List<String> ingredients,
    @Default([]) List<String> relatedProductIds,
    @Default([]) List<RecipeStep> steps,
    @Default([]) List<Product> products,
    int? stepsCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _Recipe;

  factory Recipe.fromJson(Map<String, dynamic> json) => _$RecipeFromJson(json);
}

@freezed
abstract class RecipeStep with _$RecipeStep {
  const factory RecipeStep({
    required String id,
    required int stepNumber,
    required String instruction,
    String? imageUrl,
  }) = _RecipeStep;

  factory RecipeStep.fromJson(Map<String, dynamic> json) =>
      _$RecipeStepFromJson(json);
}
