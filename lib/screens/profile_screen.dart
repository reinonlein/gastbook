import 'package:flutter/material.dart';
import 'package:gastbook/widgets/custom_drawer.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/sidebar.dart'; // Zorg ervoor dat je de juiste sidebar import hebt

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

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
              title: const Text("My Profile"),
              backgroundColor: Theme.of(context).primaryColor,
              foregroundColor: Colors.white,
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
      drawer: screenWidth < 600 ? const CustomDrawer() : null, // Geen Drawer op grotere schermen
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
