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
      backgroundColor: Colors.grey[50],
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
                  : Align(
                      alignment: Alignment.center,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(maxHeight: 400, maxWidth: 230),
                        child: Card(
                          color: Colors.white,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              // Profielfoto
                              Center(
                                child: CircleAvatar(
                                  radius: 50,
                                  backgroundImage: userData['profileImage'] != ''
                                      ? NetworkImage(userData['profileImage'])
                                      : null,
                                  child: userData['profileImage'] == ''
                                      ? const Icon(Icons.person, size: 50)
                                      : null,
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Volledige naam
                              Center(
                                child: Text(
                                  userData['fullName'] ?? 'Unknown User',
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),

                              // Email
                              Center(
                                child: Text(
                                  userData['email'] ?? 'No Email',
                                  style: const TextStyle(fontSize: 16),
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Bio
                              userData['bio'] != ''
                                  ? Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                                      child: Text(
                                        'Bio: ${userData['bio']}',
                                        style: const TextStyle(fontSize: 16),
                                      ),
                                    )
                                  : Container(),

                              // Interesses
                              userData['interests'] != null && userData['interests'].isNotEmpty
                                  ? Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Interests:',
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Wrap(
                                            spacing: 8.0,
                                            runSpacing: 4.0,
                                            children: userData['interests'].map<Widget>((interest) {
                                              return Chip(
                                                label: Text(interest),
                                                backgroundColor: Theme.of(context).primaryColor,
                                                labelStyle: TextStyle(
                                                  color: Colors.white,
                                                ),
                                              );
                                            }).toList(),
                                          ),
                                        ],
                                      ),
                                    )
                                  : Container(),

                              // Geboortedatum
                              userData['birthDate'] != null
                                  ? Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                                      child: Text(
                                        'Birth Date: ${userData['birthDate'].toDate().toLocal().toString().split(' ')[0]}', // Geboortedatum formateren
                                        style: const TextStyle(fontSize: 16),
                                      ),
                                    )
                                  : Container(),
                            ],
                          ),
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
