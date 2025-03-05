from flask import Flask, request, jsonify
from elasticsearch import Elasticsearch
import json
import os
from datetime import datetime

app = Flask(__name__)
es_host = os.getenv("ELASTICSEARCH_HOST", "localhost")
es = Elasticsearch([f"http://{es_host}:9200"])

# ================================================================
# Utility Functions (공통 ES 인덱스 및 매핑 관리)
# ================================================================

def load_mapping(file_path):
    """
    JSON 파일에서 매핑을 로드하는 함수
    KR: 주어진 파일 경로에서 ElasticSearch 매핑 정보를 로드합니다.
    """
    with open(file_path, "r") as f:
        return json.load(f)

def create_index_if_not_exists(index_name, mapping_file=None):
    """
    인덱스가 없으면 매핑을 설정하고 인덱스를 생성하는 함수
    KR: 지정된 인덱스가 존재하지 않으면, 매핑 정보를 적용하여 인덱스를 생성합니다.
    """
    if not es.indices.exists(index=index_name):
        if mapping_file:
            mapping = load_mapping(mapping_file)
            es.indices.create(index=index_name, body=mapping)
        else:
            es.indices.create(index=index_name, body={})
        return jsonify({"message": f"Index {index_name} created successfully"}), 200
    else:
        return jsonify({"message": f"Index {index_name} already exists"}), 400

def get_index_and_mapping(file_type: str):
    """
    주어진 file_type에 따라 인덱스 이름과 매핑 파일명을 반환하는 함수
    KR: file_type이 'cocktail', 'food', 'forum' 등일 때 각 ES 인덱스 이름과 매핑 파일을 반환합니다.
    """
    index_mapping = {
        "cocktail": ("recipe_cocktail", "cocktail_mapping.json"),
        "food": ("recipe_food", "food_mapping.json"),
        "cocktail_ingredient": ("cocktail_ingredient", "cocktail_ingredient_mapping.json"),
        "food_ingredient": ("food_ingredient", "food_ingredient_mapping.json"),
        "feed": ("feed", "feed_mapping.json"),
        "forum": ("forum", "forum_mapping.json"),
    }
    return index_mapping.get(file_type, (None, None))


# ================================================================
# 기존 도메인(칵테일, 음식 등) 관련 엔드포인트 (변경 없이 그대로 유지)
# ================================================================

# 글 하나 업로드
@app.route("/upload/one", methods=["POST"])
def upload_one():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        file_type = request.form.get("type")
        if not file_type:
            return jsonify({"error": "Type is required"}), 400

        index_name, mapping_file = get_index_and_mapping(file_type)

        # 인덱스가 없으면 매핑을 적용하여 생성
        if not es.indices.exists(index=index_name):
            create_index_if_not_exists(index_name, mapping_file)

        # 데이터 삽입
        es.index(index=index_name, body=data)
        return jsonify({"message": "Data uploaded successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# JSON 파일 업로드 (여러 개의 데이터 한 번에)
@app.route("/upload/json", methods=["POST"])
def upload_json():
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file provided"}), 400

        file_type = request.form.get("type")
        if not file_type:
            return jsonify({"error": "Type is required"}), 400

        index_name, mapping_file = get_index_and_mapping(file_type)

        if not es.indices.exists(index=index_name):
            create_index_if_not_exists(index_name, mapping_file)

        data = json.load(file)
        for item in data:
            es.index(index=index_name, body=item)

        return jsonify({"message": "Data uploaded successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 재료별 검색 (레시피만 검색되도록 수정)
@app.route("/search", methods=["GET"])
def search():
    try:
        q = request.args.get("q", "")
        type_filter = request.args.get("type", "")
        category = request.args.get("category", "")
        cooking_method = request.args.get("cookingMethod", "")
        page = request.args.get("page", 1, type=int)
        size = request.args.get("size", 20, type=int)

        index_name, _ = get_index_and_mapping(type_filter)
        if not index_name:
            return jsonify({"error": "Invalid type filter"}), 400

        if type_filter == "food":
            category_field = "RCP_PAT2"   # 음식은 ES 매핑에서 RCP_PAT2로 저장됨
            cooking_field = "RCP_WAY2"    # 음식의 조리방법 필드
            multi_match_fields = ["name", "ingredients.ingredient", "RCP_PAT2"]
        else:
            category_field = "category"   # 칵테일은 기존 필드 사용
            cooking_field = "cookingMethod"  # 칵테일은 조리방법 필터가 없을 수 있으므로 기본값
            multi_match_fields = ["name", "ingredients.ingredient", "category"]

        if q and category and cooking_method:
            query = {
                "bool": {
                    "must": [
                        {"multi_match": {"query": q, "fields": multi_match_fields}},
                        {"term": {category_field: {"value": category}}},
                        {"term": {cooking_field: {"value": cooking_method}}}
                    ]
                }
            }
        elif q and category:
            query = {
                "bool": {
                    "must": [
                        {"multi_match": {"query": q, "fields": multi_match_fields}},
                        {"term": {category_field: {"value": category}}}
                    ]
                }
            }
        elif q and cooking_method:
            query = {
                "bool": {
                    "must": [
                        {"multi_match": {"query": q, "fields": multi_match_fields}},
                        {"term": {cooking_field: {"value": cooking_method}}}
                    ]
                }
            }
        elif category and cooking_method:
            query = {
                "bool": {
                    "must": [
                        {"term": {category_field: {"value": category}}},
                        {"term": {cooking_field: {"value": cooking_method}}}
                    ]
                }
            }
        elif q:
            query = {"multi_match": {"query": q, "fields": multi_match_fields}}
        elif category:
            query = {"term": {category_field: {"value": category}}}
        elif cooking_method:
            query = {"term": {cooking_field: {"value": cooking_method}}}
        else:
            query = {"match_all": {}}

        if type_filter == "food":
            source_fields = ["name", "RCP_PAT2", "RCP_WAY2", "like", "abv"]
        else:
            source_fields = ["name", "category", "like", "abv"]

        body = {
            "from": (page - 1) * size,
            "size": size,
            "_source": source_fields,
            "query": query
        }

        res = es.search(index=index_name, body=body)
        results = [{**hit["_source"], "id": hit["_id"]} for hit in res["hits"]["hits"]]
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 검색 알코올 (레시피용; 단 하나만 남김)
@app.route("/search/alcohol", methods=["GET"], endpoint="unique_search_alcohol")
def search_alcohol():
    try:
        min_abv = request.args.get("min_abv", 0, type=int)
        max_abv = request.args.get("max_abv", 100, type=int)
        page = request.args.get("page", 1, type=int)
        size = request.args.get("size", 20, type=int)
        res = es.search(index="recipe_cocktail", body={
            "from": (page - 1) * size,
            "size": size,
            "_source": ["name", "category", "like"],
            "query": {
                "range": {"abv": {"gte": min_abv, "lte": max_abv}}
            }
        })
        results = [{**hit["_source"], "id": hit["_id"]} for hit in res["hits"]["hits"]]
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)})

# 상세 조회 (레시피용)
@app.route("/detail/<doc_id>", methods=["GET"], endpoint="recipe_detail")
def detail(doc_id):
    type_filter = request.args.get("type", "")
    index_name, _ = get_index_and_mapping(type_filter)
    if not index_name:
        return jsonify({"error": "Invalid type filter"}), 400
    try:
        # ES 에서 해당 ID 문서 검색 (주의: 변수 이름 수정)
        response = es.get(index=index_name, id=doc_id)
        return jsonify(response["_source"])
    except Exception as e:
        return jsonify({"error": str(e)}), 404


# ================================================================
# Forum Endpoints (ElasticSearch-based) - 새 Forum 기능
# ================================================================

# Forum 게시글 생성
@app.route("/forum/post", methods=["POST"])
def create_forum_post():
    """
    새 포럼 게시글 생성
    KR: 클라이언트로부터 받은 게시글 데이터를 기반으로 ES의 'forum' 인덱스에 게시글 문서를 생성합니다.
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "데이터가 제공되지 않았습니다."}), 400

        index_name, mapping_file = get_index_and_mapping("forum")
        if not es.indices.exists(index=index_name):
            create_index_if_not_exists(index_name, mapping_file)

        data.setdefault("viewsCount", 0)
        data.setdefault("likesCount", 0)
        data.setdefault("likedBy", [])
        data.setdefault("reportCount", 0)
        data.setdefault("comments", [])
        now = datetime.utcnow().isoformat()
        data.setdefault("createdAt", now)
        data.setdefault("updatedAt", now)

        res = es.index(index=index_name, body=data)
        return jsonify({"message": "게시글이 생성되었습니다.", "id": res["_id"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 게시글 상세 조회
@app.route("/forum/post/<doc_id>", methods=["GET"], endpoint="forum_post_detail")
def get_forum_post(doc_id):
    """
    게시글 상세 조회 (Forum)
    KR: ES 'forum' 인덱스에서 주어진 문서 ID의 게시글을 조회하여 반환합니다.
    """
    try:
        index_name, _ = get_index_and_mapping("forum")
        res = es.get(index=index_name, id=doc_id)
        return jsonify(res["_source"])
    except Exception as e:
        return jsonify({"error": str(e)}), 404

# Forum 게시글 제목 수정
@app.route("/forum/post/<doc_id>/title", methods=["PUT"])
def update_forum_post_title(doc_id):
    """
    게시글 제목 수정 (Forum)
    KR: 주어진 문서 ID의 게시글에서 제목(title)을 수정합니다.
    """
    try:
        new_title = request.json.get("title")
        if not new_title:
            return jsonify({"error": "새 제목이 필요합니다."}), 400
        index_name, _ = get_index_and_mapping("forum")
        post = es.get(index=index_name, id=doc_id)["_source"]
        post["title"] = new_title
        post["updatedAt"] = datetime.utcnow().isoformat()
        post["editedByTitle"] = request.json.get("editedBy", "USER")
        es.index(index=index_name, id=doc_id, body=post)
        return jsonify({"message": "제목이 수정되었습니다.", "title": new_title}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 게시글 내용 수정 (TipTap JSON 전용)
@app.route("/forum/post/<doc_id>/content", methods=["PUT"])
def update_forum_post_content(doc_id):
    """
    게시글 내용 수정 (Forum - TipTap JSON)
    KR: 게시글의 contentJSON 필드를 업데이트합니다.
    """
    try:
        contentJSON = request.json.get("contentJSON")
        if not contentJSON:
            return jsonify({"error": "contentJSON 필드는 필수입니다."}), 400
        index_name, _ = get_index_and_mapping("forum")
        post = es.get(index=index_name, id=doc_id)["_source"]
        post["contentJSON"] = contentJSON
        post["updatedAt"] = datetime.utcnow().isoformat()
        post["editedByContent"] = request.json.get("editedBy", "USER")
        if request.json.get("isAdmin", False):
            post["locked"] = True
        es.index(index=index_name, id=doc_id, body=post)
        return jsonify({"message": "내용이 수정되었습니다.", "contentJSON": contentJSON}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 게시글 좋아요 토글
@app.route("/forum/post/<doc_id>/like", methods=["POST"])
def toggle_forum_post_like(doc_id):
    """
    게시글 좋아요 토글 (Forum)
    KR: 특정 게시글에 대해 좋아요를 추가 또는 취소하여 likedBy 배열과 likesCount를 업데이트합니다.
    """
    try:
        req_data = request.json
        if not req_data or "memberId" not in req_data:
            return jsonify({"error": "memberId가 필요합니다."}), 400
        member_id = req_data["memberId"]
        index_name, _ = get_index_and_mapping("forum")
        post = es.get(index=index_name, id=doc_id)["_source"]
        liked_by = post.get("likedBy", [])
        if member_id in liked_by:
            liked_by.remove(member_id)
            post["likesCount"] = max(post.get("likesCount", 0) - 1, 0)
            action = "취소"
        else:
            liked_by.append(member_id)
            post["likesCount"] = post.get("likesCount", 0) + 1
            action = "추가"
        post["likedBy"] = liked_by
        post["updatedAt"] = datetime.utcnow().isoformat()
        es.index(index=index_name, id=doc_id, body=post)
        return jsonify({"message": f"좋아요가 {action}되었습니다.", "likesCount": post["likesCount"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 게시글 신고 처리
@app.route("/forum/post/<doc_id>/report", methods=["POST"])
def report_forum_post(doc_id):
    """
    게시글 신고 처리 (Forum)
    KR: 신고자 ID와 신고 사유를 받아 해당 게시글의 reportCount를 증가시키고, 신고 임계값 이상이면 게시글을 숨김 처리합니다.
    """
    try:
        req_data = request.json
        reporter_id = req_data.get("reporterId")
        reason = req_data.get("reason")
        if not reporter_id or not reason:
            return jsonify({"error": "신고자 ID와 신고 사유는 필수입니다."}), 400
        REPORT_THRESHOLD = 10
        index_name, _ = get_index_and_mapping("forum")
        post = es.get(index=index_name, id=doc_id)["_source"]
        if post["member"]["memberId"] == reporter_id:
            return jsonify({"error": "자신의 게시글은 신고할 수 없습니다."}), 400
        post["reportCount"] = post.get("reportCount", 0) + 1
        if post["reportCount"] >= REPORT_THRESHOLD:
            post["hidden"] = True
        post["updatedAt"] = datetime.utcnow().isoformat()
        es.index(index=index_name, id=doc_id, body=post)
        return jsonify({"message": "게시글이 신고되었습니다.", "reportCount": post["reportCount"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 게시글 삭제 (논리 삭제)
@app.route("/forum/post/<doc_id>", methods=["DELETE"], endpoint="delete_forum_post")
def delete_forum_post(doc_id):
    """
    게시글 삭제 (Forum, 논리 삭제)
    KR: 게시글을 실제 삭제하지 않고, 삭제 상태로 표시합니다.
        삭제 이력은 'forum_post_history' 인덱스에 기록됩니다.
    """
    try:
        index_name, _ = get_index_and_mapping("forum")
        post = es.get(index=index_name, id=doc_id)["_source"]

        history = {
            "postId": post.get("id", doc_id),
            "title": post.get("title"),
            "content": post.get("content"),
            "authorName": post.get("member", {}).get("nickName", "Unknown"),
            "deletedAt": datetime.utcnow().isoformat(),
            "fileUrls": post.get("fileUrls", [])
        }
        es.index(index="forum_post_history", body=history)

        post["removedBy"] = request.args.get("removedBy", "USER")
        post["hidden"] = True
        post["title"] = "[Deleted]"
        post["content"] = "This post has been deleted."
        post["updatedAt"] = datetime.utcnow().isoformat()
        es.index(index=index_name, id=doc_id, body=post)
        return jsonify({"message": "게시글이 삭제 처리되었습니다."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 댓글 생성
@app.route("/forum/comment", methods=["POST"])
def create_forum_comment():
    """
    댓글 생성 (Forum)
    KR: 클라이언트로부터 받은 댓글 데이터를 기반으로, 해당 게시글의 'comments' 배열에 새 댓글을 추가합니다.
    """
    try:
        data = request.json
        for field in ["postId", "memberId", "content"]:
            if field not in data:
                return jsonify({"error": f"{field} 필드는 필수입니다."}), 400

        index_name, _ = get_index_and_mapping("forum")
        post_id = str(data["postId"])
        post = es.get(index=index_name, id=post_id)["_source"]

        new_comment = {
            "id": None,
            "content": data["content"],
            "contentJSON": data.get("contentJSON", ""),
            "member": {
                "memberId": data["memberId"],
                "nickName": data.get("nickName", "")
            },
            "likesCount": 0,
            "hidden": False,
            "removedBy": None,
            "fileUrl": data.get("fileUrl", ""),
            "reportCount": 0,
            "parentCommentId": data.get("parentCommentId"),
            "opAuthorName": data.get("opAuthorName", ""),
            "opContent": data.get("opContent", ""),
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
            "editedBy": None,
            "locked": False
        }
        comments = post.get("comments", [])
        new_comment["id"] = len(comments) + 1
        comments.append(new_comment)
        post["comments"] = comments
        post["updatedAt"] = datetime.utcnow().isoformat()
        es.index(index=index_name, id=post_id, body=post)
        return jsonify({"message": "댓글이 추가되었습니다.", "comment": new_comment}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 댓글 조회
@app.route("/forum/comments", methods=["GET"])
def get_forum_comments():
    """
    댓글 조회 (Forum)
    KR: 쿼리 파라미터 'postId'에 해당하는 게시글 문서에서 'comments' 배열을 반환합니다.
    """
    try:
        post_id = request.args.get("postId")
        if not post_id:
            return jsonify({"error": "postId 파라미터가 필요합니다."}), 400
        index_name, _ = get_index_and_mapping("forum")
        post = es.get(index=index_name, id=str(post_id))["_source"]
        comments = post.get("comments", [])
        return jsonify(comments), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 댓글 수정
@app.route("/forum/comment/<int:comment_id>", methods=["PUT"])
def update_forum_comment(comment_id):
    """
    댓글 수정 (Forum)
    KR: 특정 댓글의 contentJSON (TipTap JSON)을 업데이트합니다.
    """
    try:
        req_data = request.json
        new_contentJSON = req_data.get("contentJSON")
        if not new_contentJSON:
            return jsonify({"error": "contentJSON 필드는 필수입니다."}), 400

        post_id = req_data.get("postId")
        if not post_id:
            return jsonify({"error": "postId 필드가 필요합니다."}), 400

        index_name, _ = get_index_and_mapping("forum")
        post = es.get(index=index_name, id=str(post_id))["_source"]
        comments = post.get("comments", [])
        updated = False
        for comment in comments:
            if comment.get("id") == comment_id:
                comment["contentJSON"] = new_contentJSON
                comment["updatedAt"] = datetime.utcnow().isoformat()
                comment["editedBy"] = req_data.get("editedBy", "USER")
                if req_data.get("isAdmin", False):
                    comment["locked"] = True
                updated = True
                break
        if not updated:
            return jsonify({"error": "댓글을 찾을 수 없습니다."}), 404
        post["updatedAt"] = datetime.utcnow().isoformat()
        es.index(index=index_name, id=str(post_id), body=post)
        return jsonify({"message": "댓글이 수정되었습니다."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 댓글 삭제 (논리 삭제)
@app.route("/forum/comment/<int:comment_id>", methods=["DELETE"])
def delete_forum_comment(comment_id):
    """
    댓글 삭제 (Forum, 논리 삭제)
    KR: 특정 댓글의 content를 "[Removed]"로 변경하고, hidden 상태를 true로 설정합니다.
        삭제 이력은 'forum_comment_history' 인덱스에 기록됩니다.
    """
    try:
        post_id = request.args.get("postId")
        if not post_id:
            return jsonify({"error": "postId 파라미터가 필요합니다."}), 400

        index_name, _ = get_index_and_mapping("forum")
        post = es.get(index=index_name, id=str(post_id))["_source"]
        comments = post.get("comments", [])
        deleted = False
        for comment in comments:
            if comment.get("id") == comment_id:
                history = {
                    "commentId": comment_id,
                    "content": comment.get("content"),
                    "authorName": comment.get("member", {}).get("nickName", "Unknown"),
                    "deletedAt": datetime.utcnow().isoformat()
                }
                es.index(index="forum_comment_history", body=history)
                comment["content"] = "[Removed]"
                comment["hidden"] = True
                comment["removedBy"] = request.args.get("removedBy", "USER")
                comment["updatedAt"] = datetime.utcnow().isoformat()
                deleted = True
                break
        if not deleted:
            return jsonify({"error": "댓글을 찾을 수 없습니다."}), 404
        post["updatedAt"] = datetime.utcnow().isoformat()
        es.index(index=index_name, id=str(post_id), body=post)
        return jsonify({"message": "댓글이 삭제되었습니다."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 댓글 신고 처리
@app.route("/forum/comment/<int:comment_id>/report", methods=["POST"])
def report_forum_comment(comment_id):
    """
    댓글 신고 처리 (Forum)
    KR: 신고자 ID와 신고 사유를 받아 해당 댓글의 reportCount를 증가시키고,
         신고 임계값 이상이면 댓글을 숨김 처리합니다.
    """
    try:
        req_data = request.json
        reporter_id = req_data.get("reporterId")
        reason = req_data.get("reason")
        if not reporter_id or not reason:
            return jsonify({"error": "신고자 ID와 신고 사유가 필요합니다."}), 400
        REPORT_THRESHOLD = 10
        post_id = req_data.get("postId")
        if not post_id:
            return jsonify({"error": "postId 필드가 필요합니다."}), 400
        index_name, _ = get_index_and_mapping("forum")
        post = es.get(index=index_name, id=str(post_id))["_source"]
        comments = post.get("comments", [])
        updated = False
        for comment in comments:
            if comment.get("id") == comment_id:
                if comment.get("member", {}).get("memberId") == reporter_id:
                    return jsonify({"error": "자신의 댓글은 신고할 수 없습니다."}), 400
                comment["reportCount"] = comment.get("reportCount", 0) + 1
                if comment["reportCount"] >= REPORT_THRESHOLD:
                    comment["hidden"] = True
                comment["updatedAt"] = datetime.utcnow().isoformat()
                updated = True
                break
        if not updated:
            return jsonify({"error": "댓글을 찾을 수 없습니다."}), 404
        post["updatedAt"] = datetime.utcnow().isoformat()
        es.index(index=index_name, id=str(post_id), body=post)
        return jsonify({"message": "댓글이 신고되었습니다."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forum 카테고리 조회
@app.route("/forum/category", methods=["GET"])
def get_forum_categories():
    """
    포럼 카테고리 조회 (Forum)
    KR: ES의 'forum' 인덱스 내 게시글들을 대상으로 집계(aggregation)를 사용하여 카테고리 정보를 반환합니다.
    """
    try:
        index_name, _ = get_index_and_mapping("forum")
        body = {
            "size": 0,
            "aggs": {
                "categories": {
                    "terms": {"field": "forumCategory.id"}
                }
            }
        }
        res = es.search(index=index_name, body=body)
        categories = res.get("aggregations", {}).get("categories", {}).get("buckets", [])
        return jsonify(categories), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
