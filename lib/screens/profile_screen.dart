import 'package:flutter/material.dart';
import 'package:gastbook/widgets/custom_drawer.dart';
import 'package:provider/provider.dart';
import '../models/user_data.dart';
import '../providers/auth_provider.dart';
import '../widgets/sidebar.dart';

class ProfileScreen extends StatelessWidget {
  final String? userId; // Optioneel, null betekent het huidige profiel
  const ProfileScreen({Key? key, this.userId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isCurrentUser = userId == null || userId == authProvider.user?.id;

    // Future voor het ophalen van gebruikersdata
    final Future<UserData?> userFuture = isCurrentUser
        ? Future.value(authProvider.user) // Gebruik lokale data als het de huidige gebruiker is
        : authProvider.fetchUserById(userId!); // Haal data op voor een andere gebruiker

    double screenWidth = MediaQuery.of(context).size.width;

    // Maak een GlobalKey voor de Scaffold
    final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.grey[50],
      appBar: screenWidth < 600
          ? AppBar(
              title: Text(isCurrentUser ? "My Profile" : "User Profile"),
              backgroundColor: Theme.of(context).primaryColor,
              foregroundColor: Colors.white,
              leading: IconButton(
                icon: const Icon(Icons.menu),
                onPressed: () {
                  _scaffoldKey.currentState?.openDrawer();
                },
              ),
            )
          : null,
      drawer: screenWidth < 600 ? const CustomDrawer() : null,
      body: Row(
        children: [
          if (screenWidth >= 600) const Sidebar(),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: FutureBuilder<UserData?>(
                future: userFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError || !snapshot.hasData) {
                    return const Center(child: Text("User not found."));
                  }

                  // Haal de `User` op uit de snapshot
                  final user = snapshot.data;

                  if (user == null) {
                    return const Center(child: Text("User data is unavailable."));
                  }

                  return SingleChildScrollView(
                    child: Align(
                      alignment: Alignment.center,
                      child: Column(
                        children: [
                          ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: 750),
                            child: Card(
                              color: Colors.white,
                              child: Container(
                                padding: const EdgeInsets.all(30.0),
                                width: double.infinity,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Row(
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 30.0),
                                          child: CircleAvatar(
                                            radius: 60,
                                            backgroundImage: user.profileImage.isNotEmpty
                                                ? NetworkImage(user.profileImage)
                                                : null,
                                            child: user.profileImage.isEmpty
                                                ? const Icon(Icons.person, size: 50)
                                                : null,
                                          ),
                                        ),
                                        Text(
                                          user.fullName,
                                          style: const TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: 750),
                            child: Card(
                              color: Colors.white,
                              child: Container(
                                padding: const EdgeInsets.all(30.0),
                                width: double.infinity,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.start,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'About me',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    if (user.bio.isNotEmpty)
                                      Text(
                                        user.bio,
                                        style: const TextStyle(fontSize: 15),
                                      ),
                                    const SizedBox(height: 8),
                                    const Text(
                                      "Interests:",
                                      style: TextStyle(fontSize: 15, color: Colors.grey),
                                    ),
                                    if (user.interests.isNotEmpty)
                                      Wrap(
                                        spacing: 10.0,
                                        runSpacing: 4.0,
                                        children: user.interests.map<Widget>((interest) {
                                          return ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              elevation: 0.7,
                                              minimumSize: const Size(40, 30),
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 14,
                                                vertical: 4,
                                              ),
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                            ),
                                            child: Text(
                                              interest,
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12,
                                                  letterSpacing: 1),
                                            ),
                                            onPressed: () {},
                                          );
                                        }).toList(),
                                      ),
                                    const SizedBox(height: 8),
                                    const Text(
                                      "Birthday:",
                                      style: TextStyle(fontSize: 15, color: Colors.grey),
                                    ),
                                    if (user.birthDate != null)
                                      Text(
                                        user.birthDate!.toDate().toLocal().toString().split(' ')[0],
                                        style: const TextStyle(fontSize: 15),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
