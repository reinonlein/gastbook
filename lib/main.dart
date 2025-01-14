import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:gastbook/providers/post_provider.dart';
import 'package:gastbook/screens/login_screen.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'firebase_options.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Zet de persistentie in op LOCAL, zodat gebruikers ingelogd blijven
  await firebase_auth.FirebaseAuth.instance.setPersistence(firebase_auth.Persistence.LOCAL);

  FirebaseAnalytics analytics = FirebaseAnalytics.instance;

  // Log een test event
  await analytics.logEvent(
    name: 'app_start_test_event',
    parameters: {
      'app_version': '1.0.0',
      'name': 'Gast!',
    },
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PostProvider()),
      ],
      child: MaterialApp(
        title: 'Gastbook',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(primarySwatch: Colors.blue),
        home: const LoginScreen(),
      ),
    );
  }
}
