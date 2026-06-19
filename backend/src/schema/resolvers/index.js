import { userResolvers } from './user.js';
import { cafeResolvers } from './cafe.js';
import { reviewResolvers } from './review.js';
import { folderResolvers } from './folder.js';
import { noteResolvers } from './note.js';

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...cafeResolvers.Query,
    ...folderResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...cafeResolvers.Mutation,
    ...reviewResolvers.Mutation,
    ...folderResolvers.Mutation,
    ...noteResolvers.Mutation
  },
  Cafe: cafeResolvers.Cafe,
  Review: reviewResolvers.Review,
  Folder: folderResolvers.Folder,
  PersonalNote: noteResolvers.PersonalNote
};
