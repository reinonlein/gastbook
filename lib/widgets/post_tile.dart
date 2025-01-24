import 'package:flutter/material.dart';
import 'package:gastbook/providers/auth_provider.dart';
import 'package:gastbook/providers/post_provider.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../models/post.dart';

class PostTile extends StatefulWidget {
  final Post post;
  final bool isLiked;
  final Function onLikeToggle;
  final Function onAddComment;
  final TextEditingController commentController;
  final FocusNode commentFocusNode;
  final String userFullName;

  const PostTile({
    Key? key,
    required this.post,
    required this.isLiked,
    required this.onLikeToggle,
    required this.onAddComment,
    required this.commentController,
    required this.commentFocusNode,
    required this.userFullName,
  }) : super(key: key);

  @override
  _PostTileState createState() => _PostTileState();
}

class _PostTileState extends State<PostTile> {
  bool _isExpanded = false; // Dit houdt de uitvouwstatus bij

  // Functie om een comment toe te voegen
  void _addComment(Post post) {
    if (widget.commentController.text.isEmpty) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;

    try {
      final postProvider = Provider.of<PostProvider>(context, listen: false);
      // Voeg comment toe
      postProvider.addComment(
        post.postId,
        user!.id,
        user.fullName,
        '', // Eventueel een profielafbeelding of andere data
        widget.commentController.text.trim(),
      );
      widget.commentController.clear(); // Maak het comment invoerveld leeg
      setState(() {
        // Bewaar de status van de expansion (uitgevouwen blijft uitgevouwen)
        _isExpanded = true;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding comment: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
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
                  CircleAvatar(
                    radius: 16,
                    backgroundImage: widget.post.profileImage != ''
                        ? NetworkImage(widget.post.profileImage)
                        : null,
                    child:
                        widget.post.profileImage == '' ? const Icon(Icons.person, size: 18) : null,
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        onTap: () {
                          // Profile navigatie
                        },
                        child: Text(
                          widget.post.fullName,
                          style: TextStyle(
                            color: Theme.of(context).primaryColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      Text(
                        timeago.format(widget.post.createdAt.toDate()),
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                widget.post.content,
                style: const TextStyle(fontSize: 15),
              ),
            ],
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Divider(thickness: 0.7, color: Colors.grey[200]),
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
                  initiallyExpanded: _isExpanded, // Zorg ervoor dat we de status bewaren
                  onExpansionChanged: (bool expanded) {
                    setState(() {
                      _isExpanded = expanded;
                    });
                  },
                  title: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            icon: Icon(
                              size: 17,
                              widget.isLiked ? Icons.favorite : Icons.favorite_border,
                              color: widget.isLiked ? Colors.red : Colors.grey,
                            ),
                            onPressed: () => widget.onLikeToggle(),
                          ),
                          Text(
                            '${widget.post.likes.length} ${widget.post.likes.length == 1 ? 'Like' : 'Likes'}',
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                      Text(
                        '${widget.post.comments.length} ${widget.post.comments.length == 1 ? 'Comment' : 'Comments'}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                  children: [
                    Container(
                      padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
                      child: Column(
                        children: [
                          for (var comment in widget.post.comments)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 14),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(0, 5, 12, 0),
                                    child: const CircleAvatar(
                                      radius: 14,
                                      child: Icon(Icons.person, size: 18),
                                    ),
                                  ),
                                  Container(
                                    padding:
                                        const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: Colors.grey[50],
                                      borderRadius: BorderRadius.circular(15.0),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          comment['fullName'],
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                            letterSpacing: 0.7,
                                            color: Theme.of(context).primaryColor,
                                          ),
                                        ),
                                        const SizedBox(height: 4.0),
                                        Text(
                                          comment['content'],
                                          style: const TextStyle(
                                            fontSize: 14.0,
                                            color: Colors.black87,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(0, 5, 12, 0),
                                  child: const CircleAvatar(
                                    radius: 14,
                                    child: Icon(Icons.person, size: 18),
                                  ),
                                ),
                                Expanded(
                                  child: Container(
                                    padding:
                                        const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: Colors.grey[50],
                                      borderRadius: BorderRadius.circular(15.0),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const SizedBox(height: 4.0),
                                        TextField(
                                          controller: widget.commentController,
                                          focusNode: widget.commentFocusNode,
                                          decoration: InputDecoration(
                                            hintText: 'Comment as ${widget.userFullName}',
                                            hintStyle: TextStyle(color: Colors.grey),
                                            border: InputBorder.none,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                SizedBox(width: 10),
                                ElevatedButton(
                                  onPressed: () {
                                    _addComment(widget.post); // Voer de comment actie uit
                                  },
                                  child: Text('Add'),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
