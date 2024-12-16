import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT;
const region = process.env.REGION; // Initialize DynamoDB client
const client = new DynamoDBClient({
  endpoint,
  region,
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names and index names
const TABLES = {
  POST: "PostTable",
  MEDIA: "MediaTable",
  USER: "UserTable",
};

const INDEXES = {
  USER_POSTS: "UserPosts",
  USER_MEDIA: "UserMedia",
};

// Helper functions
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

const handleError = (error) => {
  console.error("Error:", error);
  return createResponse(500, { message: "Internal server error" });
};

// Operation handlers
async function getPostById(postId) {
  const command = new GetCommand({
    TableName: TABLES.POST,
    Key: { postID: postId },
  });

  const response = await docClient.send(command);
  if (!response.Item) {
    return createResponse(404, { message: "Post not found" });
  }
  return createResponse(200, response.Item);
}

async function getMediaById(mediaId) {
  const command = new GetCommand({
    TableName: TABLES.MEDIA,
    Key: { mediaID: mediaId },
  });

  const response = await docClient.send(command);
  if (!response.Item) {
    return createResponse(404, { message: "Media not found" });
  }
  return createResponse(200, response.Item);
}

async function listAllPosts() {
  const command = new ScanCommand({
    TableName: TABLES.POST,
  });

  const response = await docClient.send(command);
  return createResponse(200, response.Items);
}

async function listAllMedia() {
  const command = new ScanCommand({
    TableName: TABLES.MEDIA,
  });

  const response = await docClient.send(command);
  return createResponse(200, response.Items);
}

async function listPostsByUserId(userId) {
  const command = new QueryCommand({
    TableName: TABLES.POST,
    IndexName: INDEXES.USER_POSTS,
    KeyConditionExpression: "userID = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  });

  const response = await docClient.send(command);
  return createResponse(200, response.Items);
}

async function listMediaByUserId(userId) {
  const command = new QueryCommand({
    TableName: TABLES.MEDIA,
    IndexName: INDEXES.USER_MEDIA,
    KeyConditionExpression: "userID = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  });

  const response = await docClient.send(command);
  return createResponse(200, response.Items);
}

// Main Lambda handler
export const getItemsHandler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const { type, id, userId } = queryParams;

    switch (type) {
      case "post":
        if (id) {
          return await getPostById(id);
        } else if (userId) {
          return await listPostsByUserId(userId);
        } else {
          return await listAllPosts();
        }

      case "media":
        if (id) {
          return await getMediaById(id);
        } else if (userId) {
          return await listMediaByUserId(userId);
        } else {
          return await listAllMedia();
        }

      default:
        // If no type specified, return all posts (default behavior)
        return await listAllPosts();
    }
  } catch (error) {
    return handleError(error);
  }
};
