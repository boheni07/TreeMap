import 'package:flutter/material.dart';
import 'screens/camera_screen.dart';

void main() {
  runApp(const TreeSurveyApp());
}

class TreeSurveyApp extends StatelessWidget {
  const TreeSurveyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TreeMap - AI Tree Survey',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.green,
        useMaterial3: true,
      ),
      home: const CameraScreen(),
    );
  }
}
