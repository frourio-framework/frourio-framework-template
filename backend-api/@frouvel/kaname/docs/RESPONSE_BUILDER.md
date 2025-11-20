# ResponseBuilder - Builder Pattern for API Responses

`ResponseBuilder`は、バリデーションとレスポンス生成を流暢なAPIで記述できるBuilderパターンの実装です。

## 特徴

- **ワンライナーでの実装**: controllerのメソッドを1行で記述可能
- **自動バリデーション**: Zodスキーマを使った型安全なバリデーション
- **RFC9457準拠**: エラーレスポンスは自動的にRFC9457形式に
- **流暢なAPI**: メソッドチェーンで可読性の高いコード

## 基本的な使い方

### 1. シンプルなバリデーション + ハンドラー

```typescript
import { ResponseBuilder } from '$/app/http/ApiResponse';
import { z } from 'zod';

export default defineController(() => ({
  post: ({ body }) =>
    ResponseBuilder.create()
      .withZodValidation(
        body,
        z.object({
          name: z.string().min(1, '名前は必須です'),
          email: z.string().email('有効なメールアドレスを入力してください'),
        }),
      )
      .handle((data) => {
        // data は型安全
        return ApiResponse.success({
          message: 'ユーザーを作成しました',
          user: data,
        });
      }),
}));
```

### 2. ビジネスロジックバリデーション付き

```typescript
export default defineController(() => ({
  put: ({ body }) =>
    ResponseBuilder.create()
      .withZodValidation(
        body,
        z.object({
          age: z.number().positive(),
          email: z.string().email(),
        }),
      )
      .handle((data) => {
        // ビジネスロジックでのバリデーション
        if (data.age < 18) {
          return ApiResponse.forbidden('18歳未満は登録できません', {
            minAge: 18,
            providedAge: data.age,
          });
        }

        // 成功レスポンス
        return ApiResponse.success(data);
      }),
}));
```

### 3. `then()` エイリアスを使用

`.handle()` の代わりに `.then()` も使用可能です:

```typescript
ResponseBuilder.create()
  .withZodValidation(body, schema)
  .then((data) => ApiResponse.success(data));
```

### 4. `executeWithSuccess()` で自動成功レスポンス

ビジネスロジックエラーがない場合、自動的に`ApiResponse.success()`でラップされます:

```typescript
export default defineController(() => ({
  post: ({ body }) =>
    ResponseBuilder.create()
      .withZodValidation(
        body,
        z.object({
          name: z.string(),
          age: z.number(),
        }),
      )
      .executeWithSuccess((data) => {
        // エラーがある場合のみエラーレスポンスを返す
        if (data.age < 18) {
          return ApiResponse.forbidden('18歳未満は登録できません');
        }

        // 自動的に ApiResponse.success() でラップされる
        return {
          message: 'ユーザーを作成しました',
          user: data,
        };
      }),
}));
```

## Validator vs ResponseBuilder

### Validator (従来の方法)

```typescript
return Validator.validateAndExecute(body, schema, (data) => {
  if (data.age < 18) {
    return ApiResponse.forbidden('18歳未満です');
  }
  return ApiResponse.success(data);
});
```

### ResponseBuilder (新しい方法)

```typescript
return ResponseBuilder.create()
  .withZodValidation(body, schema)
  .handle((data) => {
    if (data.age < 18) {
      return ApiResponse.forbidden('18歳未満です');
    }
    return ApiResponse.success(data);
  });
```

## どちらを使うべきか？

- **Validator**: シンプルで短いバリデーション
- **ResponseBuilder**: 複雑なロジックや、よりビルダーパターンの流暢さを好む場合

両方とも同じ機能を提供し、どちらを選んでも問題ありません。チームの好みや、コードスタイルに合わせて選択してください。

## メソッド一覧

### `ResponseBuilder.create()`

新しいBuilderインスタンスを作成

### `.withZodValidation(data, schema)`

Zodスキーマでデータをバリデーション

**パラメータ:**

- `data`: バリデーション対象のデータ
- `schema`: Zodスキーマ

**戻り値:**

- バリデーション済みデータを持つBuilderインスタンス

### `.handle(handler)`

バリデーション済みデータでハンドラーを実行

**パラメータ:**

- `handler`: `(data: T) => Response` 形式の関数

**戻り値:**

- ハンドラーの戻り値、またはバリデーションエラー

### `.then(handler)`

`.handle()` のエイリアス

### `.executeWithSuccess(handler)`

ハンドラーを実行し、エラーでない場合は自動的に`ApiResponse.success()`でラップ

**パラメータ:**

- `handler`: `(data: T) => any | ApiResponse` 形式の関数

**戻り値:**

- エラーレスポンス、または成功レスポンス

## エラーハンドリング

バリデーションエラーは自動的にRFC9457形式で返されます:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "バリデーションエラー",
  "errors": [
    {
      "field": "email",
      "message": "有効なメールアドレスを入力してください"
    },
    {
      "field": "age",
      "message": "年齢は正の数である必要があります"
    }
  ]
}
```

## 型安全性

TypeScriptの型推論により、バリデーション後のデータは完全に型安全です:

```typescript
.withZodValidation(
  body,
  z.object({
    name: z.string(),
    age: z.number(),
  })
)
.handle((data) => {
  // data の型は { name: string; age: number } と推論される
  data.name; // ✅ OK
  data.age;  // ✅ OK
  data.foo;  // ❌ TypeScriptエラー
})
```

## ベストプラクティス

1. **スキーマは再利用可能にする**

   ```typescript
   const userSchema = z.object({
     name: z.string(),
     email: z.string().email(),
   });

   // 複数の場所で使用
   ResponseBuilder.create().withZodValidation(body, userSchema);
   ```

2. **ビジネスロジックはhandler内で**

   ```typescript
   .handle((data) => {
     // ✅ ビジネスロジック
     if (data.age < 18) {
       return ApiResponse.forbidden('未成年です');
     }
     return ApiResponse.success(data);
   })
   ```

3. **ワンライナーを活用**
   ```typescript
   // ✅ 簡潔で読みやすい
   post: ({ body }) =>
     ResponseBuilder.create()
       .withZodValidation(body, schema)
       .handle((data) => ApiResponse.success(data));
   ```

## 実装例

完全な実装例は [`backend-api/api/example-rfc9457/controller.ts`](../api/example-rfc9457/controller.ts) の `options` メソッドを参照してください。
