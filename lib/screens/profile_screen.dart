import 'package:flutter/material.dart';
import '../screens/feed_screen.dart';
import '../widgets/sidebar.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  void _navigateWithoutAnimation(BuildContext context, Widget page) {
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => page,
        transitionDuration: Duration.zero, // Geen overgangsduur
        reverseTransitionDuration: Duration.zero, // Geen overgangsduur bij teruggaan
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          const Sidebar(), // Permanente Sidebar
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const CircleAvatar(
                    radius: 50,
                    child: Icon(Icons.person, size: 50),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'User Email',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'User ID: 12345',
                    style: TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // Navigeren naar de feed zonder overgang
                      _navigateWithoutAnimation(context, const FeedScreen());
                    },
                    child: const Text('Go to Feed'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
