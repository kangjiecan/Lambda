// Initialize DynamoDB client
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client with correct configuration
const endpoint = process.env.DYNAMODB_ENDPOINT;
const region = process.env.REGION;
const client = new DynamoDBClient({
  endpoint,
  region,
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLES = {
  POST: 'PostTable',
  MEDIA: 'MediaTable'
};

// Helper functions
const createResponse = (statusCode, body) => {
  console.log('Creating response:', { statusCode, body });
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
};

const handleError = (error) => {
  console.error('Error occurred:', {
    message: error.message,
    code: error.code,
    statusCode: error.$metadata?.httpStatusCode
  });
  return createResponse(500, { 
    message: 'Internal server error',
    details: error.message
  });
};

// Check if item exists
const checkItemExists = async (tableName, key) => {
  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: key
    });
    const response = await docClient.send(command);
    return !!response.Item;
  } catch (error) {
    console.error('Error checking item existence:', error);
    throw error;
  }
};

// Create new post
const createPost = async (postData) => {
  const { postID, userID, title, content } = postData;
  
  // Validate required fields
  if (!title) {
    return createResponse(400, { message: 'Title is required' });
  }

  // Check if post already exists
  const exists = await checkItemExists(TABLES.POST, { postID });
  if (exists) {
    return createResponse(409, { message: 'Post already exists' });
  }

  const command = new PutCommand({
    TableName: TABLES.POST,
    Item: {
      postID,
      userID,
      title,
      content,
      createdAt: new Date().toISOString()
    }
  });

  await docClient.send(command);
  return createResponse(201, { 
    message: 'Post created successfully', 
    postID,
    title 
  });
};

// Edit post
const editPost = async (postID, updateData) => {
  try {
    // Check if post exists
    const exists = await checkItemExists(TABLES.POST, { postID });
    if (!exists) {
      return createResponse(404, { message: 'Post not found' });
    }

    const updateExpressions = [];
    const expressionAttributeValues = {};

    // Add title to update if provided
    if (updateData.title !== undefined) {
      updateExpressions.push('title = :title');
      expressionAttributeValues[':title'] = updateData.title;
    }

    // Add content to update if provided
    if (updateData.content !== undefined) {
      updateExpressions.push('content = :content');
      expressionAttributeValues[':content'] = updateData.content;
    }

    // Always update the updatedAt timestamp
    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: TABLES.POST,
      Key: { postID },
      UpdateExpression: `set ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const response = await docClient.send(command);
    return createResponse(200, { 
      message: 'Post updated successfully', 
      post: response.Attributes 
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Delete post (unchanged)
const deletePost = async (postID) => {
  // Check if post exists
  const exists = await checkItemExists(TABLES.POST, { postID });
  if (!exists) {
    return createResponse(404, { message: 'Post not found' });
  }

  const command = new DeleteCommand({
    TableName: TABLES.POST,
    Key: { postID }
  });

  await docClient.send(command);
  return createResponse(200, { message: 'Post deleted successfully' });
};

// Media functions remain unchanged
const createMedia = async (mediaData) => {
  const { mediaID, userID, type, url } = mediaData;

  const exists = await checkItemExists(TABLES.MEDIA, { mediaID });
  if (exists) {
    return createResponse(409, { message: 'Media already exists' });
  }

  const command = new PutCommand({
    TableName: TABLES.MEDIA,
    Item: {
      mediaID,
      userID,
      type,
      url,
      createdAt: new Date().toISOString()
    }
  });

  await docClient.send(command);
  return createResponse(201, { message: 'Media created successfully', mediaID });
};

const deleteMedia = async (mediaID) => {
  const exists = await checkItemExists(TABLES.MEDIA, { mediaID });
  if (!exists) {
    return createResponse(404, { message: 'Media not found' });
  }

  const command = new DeleteCommand({
    TableName: TABLES.MEDIA,
    Key: { mediaID }
  });

  await docClient.send(command);
  return createResponse(200, { message: 'Media deleted successfully' });
};

// Main handler function
export const handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event));
    const { httpMethod, body, pathParameters } = event;
    const parsedBody = JSON.parse(body || '{}');
    
    switch (httpMethod) {
      case 'POST': {
        const operation = event.path.split('/')[1];
        if (operation === 'post') {
          return await createPost(parsedBody);
        } else if (operation === 'media') {
          return await createMedia(parsedBody);
        }
        break;
      }
      
      case 'PUT': {
        if (pathParameters?.postID) {
          return await editPost(pathParameters.postID, parsedBody);
        }
        break;
      }

      case 'DELETE': {
        if (pathParameters?.postID) {
          return await deletePost(pathParameters.postID);
        } else if (pathParameters?.mediaID) {
          return await deleteMedia(pathParameters.mediaID);
        }
        break;
      }
    }

    return createResponse(400, { message: 'Invalid operation' });
  } catch (error) {
    return handleError(error);
  }
};