arr = [1,2,3,4,5,6,7]
target = 5
low = 0
high = len(arr) - 1
while low <= high:
    mid = low - (low + high) //2
    if arr[mid] == target:
        print(f"Target found at index {mid}")
    elif arr[mid] < target:
        low = mid + 1
    else:
        high = mid - 1

        
