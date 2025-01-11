import 'package:flutter/material.dart';
import 'package:gastbook/screens/feed_screen.dart';
import 'package:gastbook/screens/login_screen.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/sidebar.dart'; // Zorg ervoor dat je de juiste sidebar import hebt

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

  void _logout(BuildContext context) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.signOut();
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => const LoginScreen(),
        transitionDuration: Duration.zero,
        reverseTransitionDuration: Duration.zero,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userData = authProvider.userData;

    double screenWidth = MediaQuery.of(context).size.width;

    // Maak een GlobalKey voor de Scaffold
    final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

    return Scaffold(
      // Voeg de GlobalKey toe aan de Scaffold
      key: _scaffoldKey,
      // AppBar wordt alleen weergegeven als het scherm kleiner is dan 600px
      appBar: screenWidth < 600
          ? AppBar(
              title: const Text("Profile"),
              leading: IconButton(
                icon: const Icon(Icons.menu),
                onPressed: () {
                  // Gebruik de GlobalKey om de Drawer te openen
                  _scaffoldKey.currentState?.openDrawer();
                },
              ),
            )
          : null, // Geen AppBar op grotere schermen
      // De Drawer die verschijnt op kleinere schermen
      drawer: screenWidth < 600
          ? Drawer(
              child: ListView(
                padding: EdgeInsets.zero,
                children: <Widget>[
                  DrawerHeader(
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor,
                    ),
                    child: Text(
                      'Gastbook',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                      ),
                    ),
                  ),
                  ListTile(
                    leading: const Icon(Icons.home),
                    title: const Text('Feed'),
                    onTap: () {
                      _navigateWithoutAnimation(context, const FeedScreen());
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.person),
                    title: const Text('Profile'),
                    onTap: () {
                      _navigateWithoutAnimation(context, const ProfileScreen());
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.logout),
                    title: const Text('Logout'),
                    onTap: () => _logout(context),
                  ),
                ],
              ),
            )
          : null, // Geen Drawer op grotere schermen
      // De body layout
      body: Row(
        children: [
          if (screenWidth >= 600) const Sidebar(), // Sidebar alleen op grote schermen
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: userData == null
                  ? const Center(child: CircularProgressIndicator())
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundImage: userData['photoUrl'] != ''
                              ? NetworkImage(userData['photoUrl'])
                              : null,
                          child: userData['photoUrl'] == ''
                              ? const Icon(Icons.person, size: 50)
                              : null,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          userData['name'] ?? 'Unknown User',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          userData['email'] ?? 'No Email',
                          style: const TextStyle(fontSize: 16),
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
