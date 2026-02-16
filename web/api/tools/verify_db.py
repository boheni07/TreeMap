import sqlite3
import json

def verify_db():
    conn = sqlite3.connect('web/api/tree_map.db')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute('SELECT * FROM measurements')
    rows = [dict(row) for row in cur.fetchall()]
    
    with open('final_db_check.json', 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    
    print(f"총 {len(rows)}개의 레코드를 final_db_check.json에 저장했습니다.")

if __name__ == "__main__":
    verify_db()
