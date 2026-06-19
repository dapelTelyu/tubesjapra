export const baseTypeDefs = `#graphql
  enum PublishStatus {
    PENDING
    APPROVED
    REJECTED
  }

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;
