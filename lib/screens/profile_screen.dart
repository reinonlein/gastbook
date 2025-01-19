import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:gastbook/widgets/custom_drawer.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/sidebar.dart';

class ProfileScreen extends StatelessWidget {
  final String? userId; // Optioneel, null betekent het huidige profiel
  const ProfileScreen({Key? key, this.userId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isCurrentUser = userId == null || userId == authProvider.user?.uid;

    // Firestore query om gegevens van de gebruiker op te halen
    final Future<dynamic> userFuture = isCurrentUser
        ? Future.value(authProvider.userData) // Gebruik lokale data als het de huidige gebruiker is
        : FirebaseFirestore.instance.collection('users').doc(userId).get();

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
              child: FutureBuilder(
                future: userFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError || !snapshot.hasData) {
                    return const Center(child: Text("User not found."));
                  }

                  // Haal userData op uit de snapshot
                  final userData = isCurrentUser
                      ? snapshot.data as Map<String, dynamic>
                      : (snapshot.data as DocumentSnapshot).data() as Map<String, dynamic>?;

                  // Controleer of userData null is
                  if (userData == null) {
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
                                            backgroundImage: userData['profileImage'] != ''
                                                ? NetworkImage(userData['profileImage'])
                                                : null,
                                            child: userData['profileImage'] == ''
                                                ? const Icon(Icons.person, size: 50)
                                                : null,
                                          ),
                                        ),
                                        Text(
                                          userData['fullName'] ?? 'Unknown User',
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
                                    Text(
                                      'About me',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    if (userData['bio'] != '')
                                      Text(
                                        '${userData['bio']}',
                                        style: const TextStyle(fontSize: 15),
                                      ),
                                    const SizedBox(height: 8),
                                    Text(
                                      "Interests:",
                                      style: TextStyle(
                                          fontSize: 15,
                                          // fontWeight: FontWeight.bold,
                                          color: Colors.grey[500]),
                                    ),
                                    if (userData['interests'] != null &&
                                        userData['interests'].isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const SizedBox(height: 8),
                                            Wrap(
                                              spacing: 10.0,
                                              runSpacing: 4.0,
                                              children:
                                                  userData['interests'].map<Widget>((interest) {
                                                return ElevatedButton(
                                                  style: ElevatedButton.styleFrom(
                                                    elevation: 0.7,
                                                    minimumSize:
                                                        Size(40, 30), // Kleinere afmetingen
                                                    padding: EdgeInsets.symmetric(
                                                      horizontal: 14,
                                                      vertical: 4,
                                                    ), // Geen extra binnenruimte
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius: BorderRadius.circular(
                                                          8), // Subtielere hoeken
                                                    ),
                                                  ),
                                                  child: Text(
                                                    interest,
                                                    style: TextStyle(
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 12,
                                                        letterSpacing: 1),
                                                  ),
                                                  onPressed: () {},
                                                );
                                                // return Chip(
                                                //   label: Text(interest),
                                                //   backgroundColor: Colors.grey[100],
                                                //   labelStyle: TextStyle(
                                                //     fontSize: 13,
                                                //     fontWeight: FontWeight.bold,
                                                //     letterSpacing: 0.7,
                                                //     color: Colors.grey[500],
                                                //   ),
                                                //   padding: EdgeInsets.symmetric(
                                                //       horizontal: 6.0, vertical: 0.0),
                                                //   shape: RoundedRectangleBorder(
                                                //     borderRadius: BorderRadius.circular(
                                                //         50.0), // Minder ronde hoeken
                                                //   ),
                                                // );
                                              }).toList(),
                                            ),
                                          ],
                                        ),
                                      ),
                                    const SizedBox(height: 8),
                                    Text(
                                      "Birthday:",
                                      style: TextStyle(
                                          fontSize: 15,
                                          // fontWeight: FontWeight.bold,
                                          color: Colors.grey[500]),
                                    ),
                                    if (userData['birthDate'] != null)
                                      Padding(
                                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                                        child: Text(
                                          userData['birthDate']
                                              .toDate()
                                              .toLocal()
                                              .toString()
                                              .split(' ')[0],
                                          style: TextStyle(
                                            fontSize: 15,
                                            color: Colors.grey[500],
                                          ),
                                        ),
                                      ),
                                    const SizedBox(height: 16),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          ConstrainedBox(
                            constraints: BoxConstraints(maxHeight: 400, maxWidth: 750),
                            child: Card(
                              color: Colors.white,
                              child: Container(
                                padding: const EdgeInsets.all(30.0),
                                width: double.infinity,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.start,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Friends',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    if (userData['friends'] != null)
                                      Text(
                                        "${userData['friends'].length.toString()} friends",
                                        style: TextStyle(
                                            fontSize: 15,
                                            // fontWeight: FontWeight.bold,
                                            color: Colors.grey[500]),
                                      ),
                                    const SizedBox(height: 16),
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
