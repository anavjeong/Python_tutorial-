

# if 문 사용법


# number = int(input())


# if number < 5:
#     print('숫자가 5보다 작습니다.')

# elif 5 < number < 10:
#     print("5보다 크고 10보다 작습니다.")

# else:
#     print("10보다 큽니다.")



#예제

# money = int(input())

# if money >= 7:
#     print(str(money) +"만원으로 비행기를 타자.")
# elif money >= 5:
#     print(str(money) +"만원으로 기차를 타자.")
# elif money >= 3:
#     print(str(money) +"만원으로 버스를 타자.")
# else: 
#     print("야 걍 걸어가")



#for 반복문

# countries = ['kor','usa','chn']

# for country in countries: 
#     print(country)

# # 만약에 countries를 "" 안에 넣으면 ""안에 넣은 countries는 문자열로 나열되어 프린트 된다. 
# # for country in countries: 
# #    print(country)

# for country in countries: 
#     if country == 'kor':
#         print('한국어로 입력주세요.')


# while 반복문

# while은 바로 조건문이 나온다.
# while를 사용할 때는 변수를 넣어야 한다.
# while 무한반복을 해야 할 때는 사용한다. if도 할 수 있지만 복잡하다.

# a = 0
# while a < 5:
#     a = a + 1
#     print(a)


#1부터 5까지 더하는 프로그램을 만들어보시오. 


a = 0
while a < 6:
    a = a + 1
    b = a + a
    print(b)

print("__________")
a = 0

for i in range(1,6):
    a = a + i
    print(a)

print("__________")


for i in range(10):
    if 3<=i<=5:
        continue
        break
    print(i)
