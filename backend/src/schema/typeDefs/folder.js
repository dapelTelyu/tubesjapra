export const folderTypeDefs = `#graphql
  type Folder {
    id: ID!
    userId: ID!
    name: String!
    createdAt: String
    updatedAt: String
    cafes: [Cafe!]
  }

  extend type Query {
    getUserFolders(userId: ID!): [Folder!]!
  }

  extend type Mutation {
    createFolder(
      userId: ID!
      name: String!
    ): Folder!
    addCafeToFolder(
      folderId: ID!
      cafeId: ID!
    ): Boolean!
  }
`;
