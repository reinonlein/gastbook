import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../providers/auth_provider.dart';
import '../providers/post_provider.dart';
import '../widgets/custom_drawer.dart';
import '../widgets/sidebar.dart';
import 'profile_screen.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({Key? key}) : super(key: key);

  @override
  _FeedScreenState createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final TextEditingController _postController = TextEditingController();
  bool _isLoading = false;
  bool _showOwnPostsOnly = false;

  // Functie om een nieuwe post toe te voegen
  Future<void> _addPost(BuildContext bottomSheetContext) async {
    if (_postController.text.isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userId = authProvider.user?.uid;
    final fullName = authProvider.userData?['fullName'];

    try {
      final postProvider = Provider.of<PostProvider>(context, listen: false);
      await postProvider.addPost(_postController.text.trim(), userId!, fullName);

      _postController.clear(); // Maak het invoerveld leeg na het posten

      Navigator.pop(bottomSheetContext); // Sluit de BottomSheet
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding post: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // BottomSheet openen
  void _openPostBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[50],
      builder: (BuildContext bottomSheetContext) {
        return Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              TextField(
                controller: _postController,
                decoration: const InputDecoration(
                  hintText: 'What\'s on your mind?',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 8),
              _isLoading
                  ? const CircularProgressIndicator()
                  : ElevatedButton(
                      onPressed: () => _addPost(bottomSheetContext),
                      child: const Text('Post'),
                    ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final postProvider = Provider.of<PostProvider>(context);
    final userId = authProvider.user?.uid;

    double screenWidth = MediaQuery.of(context).size.width;

    final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.grey[50],
      resizeToAvoidBottomInset: true,
      appBar: screenWidth < 600
          ? AppBar(
              title: const Text("Gastbook"),
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
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      const Text("Show my posts only: "),
                      Switch(
                        value: _showOwnPostsOnly,
                        onChanged: (value) {
                          setState(() {
                            _showOwnPostsOnly = value;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: StreamBuilder<QuerySnapshot>(
                      stream: _showOwnPostsOnly
                          ? FirebaseFirestore.instance
                              .collection('posts')
                              .where('userId', isEqualTo: userId)
                              .orderBy('createdAt', descending: true)
                              .snapshots()
                          : postProvider.posts,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }

                        if (snapshot.hasError) {
                          return Center(child: Text('Error: ${snapshot.error}'));
                        }

                        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                          return const Center(child: Text('No posts available.'));
                        }

                        final posts = snapshot.data!.docs;
                        return ListView.builder(
                          itemCount: posts.length,
                          itemBuilder: (context, index) {
                            // Maak een mutable Map van de post
                            final postSnapshot = posts[index];
                            final post = postSnapshot.data() as Map<String, dynamic>;
                            post['id'] = postSnapshot.id;

                            final isLiked = (post['likes'] as List<dynamic>)
                                .any((like) => like['userId'] == userId);
                            final likeCount = (post['likes'] as List<dynamic>).length;
                            final commentCount = (post['comments'] as List<dynamic>).length;

                            return Center(
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(maxWidth: 750),
                                child: Card(
                                  margin: const EdgeInsets.symmetric(vertical: 8),
                                  color: Colors.white,
                                  child: Padding(
                                    padding: const EdgeInsets.all(0.0),
                                    child: ListTile(
                                      contentPadding: const EdgeInsets.fromLTRB(25, 12, 25, 0),
                                      title: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              const CircleAvatar(
                                                radius: 16,
                                                child: Icon(Icons.person, size: 18),
                                              ),
                                              const SizedBox(width: 12),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  GestureDetector(
                                                    onTap: () {
                                                      Navigator.push(
                                                        context,
                                                        MaterialPageRoute(
                                                          builder: (context) => ProfileScreen(
                                                            userId: post['userId'],
                                                          ),
                                                        ),
                                                      );
                                                    },
                                                    child: Text(
                                                      post['fullName'],
                                                      style: TextStyle(
                                                        color: Theme.of(context).primaryColor,
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                  ),
                                                  Text(
                                                    post['createdAt'] != null
                                                        ? timeago.format(
                                                            (post['createdAt'] as Timestamp)
                                                                .toDate())
                                                        : 'Unknown time',
                                                    style: const TextStyle(
                                                        fontSize: 12, color: Colors.grey),
                                                  ),
                                                ],
                                              )
                                            ],
                                          ),
                                        ],
                                      ),
                                      subtitle: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Padding(
                                            padding: const EdgeInsets.fromLTRB(0, 25, 0, 12),
                                            child: Text(
                                              post['content'],
                                              style: const TextStyle(fontSize: 15),
                                            ),
                                          ),
                                          Divider(
                                            thickness: 0.7,
                                            color: Colors.grey[200],
                                          ),
                                          Theme(
                                            data: ThemeData(
                                              dividerColor: Colors.transparent,
                                              hoverColor: Colors.transparent,
                                              splashColor: Colors.transparent,
                                              highlightColor: Colors.transparent,
                                            ),
                                            child: ExpansionTile(
                                              tilePadding: EdgeInsets.zero,
                                              trailing: SizedBox(),
                                              title: Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                                children: [
                                                  // Toon het aantal likes
                                                  Row(
                                                    children: [
                                                      IconButton(
                                                        icon: Icon(
                                                          size: 17,
                                                          isLiked
                                                              ? Icons.favorite
                                                              : Icons.favorite_border,
                                                          color: isLiked ? Colors.red : Colors.grey,
                                                        ),
                                                        onPressed: () {
                                                          postProvider.toggleLike(
                                                            post['id'],
                                                            userId!,
                                                            authProvider.userData?['fullName'] ??
                                                                '',
                                                            authProvider
                                                                    .userData?['profileImage'] ??
                                                                '',
                                                          );
                                                        },
                                                      ),
                                                      Text(
                                                        '$likeCount ${likeCount == 1 ? 'Like' : 'Likes'}',
                                                        style: const TextStyle(
                                                            fontSize: 12, color: Colors.grey),
                                                      ),
                                                    ],
                                                  ),
                                                  Text(
                                                    '$commentCount ${commentCount == 1 ? 'Comment' : 'Comments'}',
                                                    style: const TextStyle(
                                                        fontSize: 12, color: Colors.grey),
                                                  ),
                                                ],
                                              ),
                                              children: [
                                                // Gebruik een Container om de commentaarlijst in te pakken
                                                Container(
                                                  padding: const EdgeInsets.all(8.0),
                                                  child: Column(
                                                    children: [
                                                      // Maak een lijst van de reacties
                                                      for (var comment in post['comments'])
                                                        ListTile(
                                                          title: Text(comment['text']),
                                                        ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          // MANIER OM SHOW MORE COMMENTS TOE TE PASSEN
                                          // if (commentCount > 0)
                                          //   ListTile(
                                          //     title: Text(post['comments'][0]['text']),
                                          //   ),
                                          // if (commentCount > 1)
                                          //   Theme(
                                          //     data: ThemeData(
                                          //       dividerColor: Colors.transparent,
                                          //       hoverColor: Colors.transparent,
                                          //     ),
                                          //     child: ExpansionTile(
                                          //       tilePadding: EdgeInsets.zero,
                                          //       trailing: SizedBox(),
                                          //       title: TextButton(
                                          //         onPressed: null,
                                          //         child: Text(
                                          //             'Show ${commentCount - 1} more comments'),
                                          //       ),
                                          //       children: [
                                          //         // Gebruik een Container om de commentaarlijst in te pakken
                                          //         Container(
                                          //           padding: const EdgeInsets.all(8.0),
                                          //           child: Column(
                                          //             children: [
                                          //               // Maak een lijst van de reacties
                                          //               for (var comment
                                          //                   in post['comments'].skip(1))
                                          //                 ListTile(
                                          //                   title: Text(comment['text']),
                                          //                 ),
                                          //             ],
                                          //           ),
                                          //         ),
                                          //       ],
                                          //     ),
                                          //   ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openPostBottomSheet,
        backgroundColor: Theme.of(context).primaryColor,
        child: const Icon(
          Icons.add,
          color: Colors.white,
        ),
      ),
    );
  }
}
