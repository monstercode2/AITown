from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Optional, Any
from backend.models import Event, ResponseModel
from backend.services.event_service import EventService
from backend.services.llm_service import LLMService
from backend.state import events
import time
from backend.services.supabase_client import supabase
import os

router = APIRouter()

def get_event_service():
    return EventService()

@router.get("/api/event")
def get_events(type: Optional[str] = None, limit: Optional[int] = None, offset: int = 0, service: EventService = Depends(get_event_service)):
    # 日志
    print(f"API事件查询请求: type={type}, limit={limit}, offset={offset}")
    
    # 获取事件数据
    events = service.get_events(type, limit, offset)
    print(f"从服务层获取到{len(events)}个事件")
    
    events_dict_list = []
    
    # 处理数据并转换字段名
    for e in events:
        try:
            event_dict = e.dict(exclude_none=True)  # 排除None值
            
            # 字段名转换：下划线转为驼峰（后端→前端）
            field_mapping = {
                'affected_agents': 'affectedAgents',
                'start_time': 'startTime',
                'created_at': 'createdAt',
                'from_agent': 'fromAgent',
                'to_agent': 'toAgent'
            }
            
            for old_key, new_key in field_mapping.items():
                if old_key in event_dict:
                    event_dict[new_key] = event_dict.pop(old_key)
            
            # 确保created_at/createdAt字段存在
            if 'createdAt' not in event_dict or not event_dict['createdAt']:
                event_dict['createdAt'] = time.strftime('%Y-%m-%d %H:%M:%S', 
                                                         time.localtime(event_dict.get('startTime', int(time.time()))/1000))
            
            # 可选：移除不需要的字段
            if 'embedding' in event_dict:
                del event_dict['embedding']  # 向量字段太大，前端不需要
            
            events_dict_list.append(event_dict)
        except Exception as ex:
            print(f"处理事件数据失败: {ex}")
            # 尝试最小化处理
            try:
                minimal_dict = {
                    'id': e.id if hasattr(e, 'id') else f"error-{time.time()}",
                    'type': e.type if hasattr(e, 'type') else 'UNKNOWN',
                    'description': e.description if hasattr(e, 'description') else '事件数据异常',
                    'affectedAgents': [],
                    'startTime': int(time.time() * 1000),
                    'duration': 60000,
                    'createdAt': time.strftime('%Y-%m-%d %H:%M:%S')
                }
                events_dict_list.append(minimal_dict)
            except:
                pass  # 如果连最小化处理都失败，就跳过
    
    # 将结果输出到控制台供调试
    print(f"API返回{len(events_dict_list)}个事件")
    if events_dict_list:
        print(f"第一个事件数据示例: {events_dict_list[0]}")
    
    return ResponseModel(data=events_dict_list)

@router.post("/api/event")
def add_event(event: Event, service: EventService = Depends(get_event_service)):
    service.add_event(event)
    return ResponseModel(data=event.dict())

@router.delete("/api/event/{event_id}")
def delete_event(event_id: str, service: EventService = Depends(get_event_service)):
    success = service.delete_event(event_id)
    return ResponseModel(data={"success": success, "message": f"事件已删除: {event_id}"})

# 新增：LLM生成事件接口
@router.post("/api/event/llm_generate")
def llm_generate_event(context: Any = Body(...)):
    """
    context: dict，建议包含 time, day, hour, agents 等
    """
    try:
        event_obj = LLMService().generate_event_via_llm(context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM事件生成失败: {e}")
    # 自动补全事件字段
    event = Event(
        id=str(int(time.time() * 1000)),
        type=event_obj.get('type', 'LLM'),
        description=event_obj.get('description', ''),
        affectedAgents=event_obj.get('affectedAgents', []),
        startTime=int(time.time() * 1000),
        duration=event_obj.get('duration', 300000),
        impact=event_obj.get('impact', {}),
        meta=event_obj,
        scope=event_obj.get('scope'),
        position=event_obj.get('position'),
        content=event_obj.get('content', None),
        created_at=time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
    )
    events.append(event)
    return ResponseModel(data=event.dict())

@router.post("/api/event/search_by_vector")
def search_events_by_vector(
    query: dict,  # {"embedding": [...], "top_k": 5}
    service: EventService = Depends(get_event_service)
):
    embedding = query.get("embedding")
    top_k = query.get("top_k", 5)
    if not embedding or not isinstance(embedding, list):
        raise HTTPException(status_code=400, detail="embedding字段缺失或格式错误")
    events = service.search_events_by_embedding(embedding, top_k)
    return ResponseModel(data=[e.dict() for e in events])

@router.get("/api/event/debug")
def debug_events():
    """直接执行SQL查询事件表，用于调试"""
    try:
        # 获取Supabase连接信息
        supabase_url = os.environ.get('SUPABASE_URL', 'Unknown')
        print(f"Supabase连接URL: {supabase_url}")
        
        # 尝试直接查询数据
        print("开始直接查询事件表...")
        res = supabase.table('events').select('*').limit(10).execute()
        
        print(f"查询结果: 获取到{len(res.data)}条记录")
        
        # 格式化输出
        events_data = []
        for e in res.data:
            # 尝试简化数据，排除向量字段和过长的JSON
            event_simple = {k: v for k, v in e.items() if k != 'embedding'}
            for field in ['meta', 'impact', 'affected_agents', 'position']:
                if field in event_simple and event_simple[field] is not None:
                    if isinstance(event_simple[field], str) and len(event_simple[field]) > 100:
                        event_simple[field] = event_simple[field][:100] + "..."
            events_data.append(event_simple)
        
        # 尝试获取数据库中的所有表
        try:
            tables_query = supabase.rpc('get_tables').execute()
            tables = tables_query.data
        except Exception as te:
            tables = ["获取表列表失败: " + str(te)]
            
        return ResponseModel(data={
            "connection": "成功",
            "tables": tables,
            "events_count": len(res.data),
            "events": events_data
        })
    except Exception as e:
        print(f"调试查询失败: {e}")
        return ResponseModel(code=500, msg=f"调试查询失败: {str(e)}", data=[]) 