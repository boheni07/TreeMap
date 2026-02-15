class TreeData {
  final double dbh; // 흉고직경 (cm)
  final double height; // 수고 (m)
  final String species; // 수종
  final double healthScore; // 건강도 점수 (0-100)
  final DateTime measuredAt;

  TreeData({
    required this.dbh,
    required this.height,
    required this.species,
    required this.healthScore,
    required this.measuredAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'dbh': dbh,
      'height': height,
      'species': species,
      'healthScore': healthScore,
      'measuredAt': measuredAt.toIso8601String(),
    };
  }
}
